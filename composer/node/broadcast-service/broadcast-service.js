/*
* Software Name : abcdesktop.io
* Version: 0.2
* SPDX-FileCopyrightText: Copyright (c) 2020-2021 Orange
* SPDX-License-Identifier: GPL-2.0-only
*
* This software is distributed under the GNU General Public License v2.0 only
* see the "license.txt" file for more details.
*
* Author: abcdesktop.io team
* Software description: cloud native desktop service
*/

const ChildProcess = require('child_process');
const { Server: WebSocketServer } = require('ws');

const PORT = process.env.BROADCAST_SERVICE_TCP_PORT || 29784;
const KEEPALIVE_TIMEOUT = 30000;

const wss = new WebSocketServer({
  port: PORT,
  host: process.env.CONTAINER_IP_ADDR,
});

function broadcastconnectionlist() {
  //console.log('start broadcastconnectionlist');
  try {
    const command = '/composer/connectcount.sh';
    ChildProcess.exec(command, (err, stdout, stderr) => {
      if (err || stderr) {
        console.log(`broadcastconnectionlist command ${command} failed`);
        console.log(err);
      } else {
        const strcounter = stdout.toString();
        const response = {
          method: 'connect.counter',
          data: parseInt(strcounter, 10),
        };
        wss.broadcast(JSON.stringify(response));
      }
    });
  } catch (e) {
    console.log('broadcastconnectionlist send message connect.counter failed');
    console.error(e);
  }
}

function getstrJSONstatus() {
  const data = {
    data: 'I am a teapot', // reserved in standard RFC 9110, https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/418
    date: Date.now().toString(),
  };
  const message = { method: 'keepalive', data };
  return JSON.stringify(message);
}

wss.broadcast = (data) => {
  console.log(`broadcast: ${data}`);
  wss.clients.forEach((client) => {
    try {
      client.send(data);
    } catch (err) {
      console.error(err);
    }
  });
};

wss.broadcast_keepalive = () => {
  console.log('broadcast keep_alive');
  wss.broadcast(getstrJSONstatus());
  setTimeout(wss.broadcast_keepalive, KEEPALIVE_TIMEOUT);
};

wss.unicast = (ws, data) => {
  let bSendDone = false;
  console.log( `wss.clients.size=${wss.clients.size}` );
  for (const client of wss.clients) {
    // Broadcast to one only of everyone EXCEPT the sender
    if (client !== ws && client.readyState === 1) {
      if (bSendDone) {
        continue;
      }
      try {
      	// Broadcast to everyone EXCEPT the sender
	console.log('sending unicat');
      	client.send(data);
      	bSendDone = true;
        console.log('send unicat done');
      }
      catch (err) {
      	console.error(err);
      }
    }
    else {
        console.log( 'ws client is skipped, except the sender')
    }
  }
};

wss.on('connection', async (ws, req) => {

  console.log('connection');
  const { remoteAddress }    = req.connection;
  const { broadcast_cookie } = req.headers;
  console.log( "remoteAddress=" + remoteAddress );
  console.log( "broadcast_cookie=" + broadcast_cookie );
  console.log( "process.env.CONTAINER_IP_ADDR=" + process.env.CONTAINER_IP_ADDR );
  console.log( "process.env.BROADCAST_COOKIE=" + process.env.BROADCAST_COOKIE );
  // console.log( "dump req.headers" ); 
  // console.log( JSON.stringify(req.headers, null, 4) ); 

  if ( remoteAddress !== process.env.CONTAINER_IP_ADDR && broadcast_cookie !== process.env.BROADCAST_COOKIE ) {
      console.log( `incoming request from external ${remoteAddress} calling broadcastconnectionlist`);
      // first connection
      // send a broadcast connection list 
      // to notify connected session of a new session
      // do not notify local client
      broadcastconnectionlist();
  }
  else {
      console.log(`connection permit from ip source ${remoteAddress} and broadcast_cookie ${broadcast_cookie}`);	 
  }
  
  ws.on('message', async (message) => {
    console.log(`received message ${message}`);
    let json;
    try {
      json = JSON.parse(message);
    } catch (e) {
      console.error("Bad data, can't parse data received");
      ws.close();
      return;
    }

    // filter method
    // broadcast send
    let broadcast_methods = [ 'hello', 'proc.killed', 'proc.started', 'window.list', 'printer.new', 'printer.available', 'display.setBackgroundBorderColor', 'speaker.available', 'snapshot' ];
    if (broadcast_methods.includes( json.method ) ) {
      console.log(`sending: ${message}`);
      wss.broadcast(message);
    }

    // send connect counter
    if (json.method === 'connect.counter') {
      broadcastconnectionlist();
    }

    // unicast send
    let unicast_methods = [ 'ocrun', 'logout', 'disconnect', 'container', 'download' ];
    if ( unicast_methods.includes( json.method ) ) {
      console.log(`unicast send method ${json.method}`);
      wss.unicast(ws, message);
    }
  });

  ws.on('close', () => {
    console.log('ws is closed');
    // notify other that the connection is closed
    if (remoteAddress !== process.env.CONTAINER_IP_ADDR && broadcast_cookie !== process.env.BROADCAST_COOKIE ) {
      broadcastconnectionlist();
    }
  });
});

// ping pong to keep alive
wss.broadcast_keepalive();
