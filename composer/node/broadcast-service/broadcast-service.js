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
const { assertIp } = require('oc.user.libraries');

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
    data: 'I am a teapot',
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

wss.unicast = (data) => {
  let bSendDone = false;
  for (const client of wss.clients) {
    if (bSendDone) {
      continue;
    }

    try {
      console.log('unicat try to send');
      console.log(data);
      client.send(data);
      bSendDone = true;
      console.log('unicat done');
    } catch (err) {
      console.error(err);
    }
  }
};

wss.on('connection', async (ws, req) => {
  console.log('connection');
  const { remoteAddress } = req.connection;

  if (remoteAddress !== process.env.CONTAINER_IP_ADDR) {
      try {
        await assertIp(remoteAddress);
      } catch (e) {
        console.log(e);
        console.log(`Connection forbiden for ip ${remoteAddress}`);
        ws.close();
        return;
      }
  }

  // first connection
  // send a broadcast connection list 
  // to notify connected session of a new session
  // do not notify local client
  if (remoteAddress !== process.env.CONTAINER_IP_ADDR) {
    console.log(`calling broadcastconnectionlist for ip ${remoteAddress}`);
    broadcastconnectionlist();
  }
  else {
    console.log(`no call to broadcastconnectionlist for ip ${remoteAddress}`);
  }

  ws.on('message', async (message) => {
    console.log('received: %s', message);
    let json;
    try {
      json = JSON.parse(message);
    } catch (e) {
      console.error("Can't parse data received");
      ws.close();
      return;
    }

    // filter method
    // broadcast send
    if ( json.method === 'hello'
      || json.method === 'proc.killed'
      || json.method === 'proc.started'
      || json.method === 'window.list'
      || json.method === 'printer.new'
      || json.method === 'display.setBackgroundBorderColor'
      || json.method === 'speaker.available'
      || json.method === 'printer.available') {
      console.log('sending: %s', message);
      wss.broadcast(message);
    }

    if (json.method === 'connect.counter') {
      broadcastconnectionlist();
    }

    // unicast send
    if ( json.method === 'ocrun'
      || json.method === 'logout'
      || json.method === 'container'
      || json.method === 'download') {
      console.log('Unicast send msg: %s', message);
      wss.unicast(message);
    }
  });

  ws.on('close', () => {
    console.log('Closed');
    if (remoteAddress !== process.env.CONTAINER_IP_ADDR) {
      broadcastconnectionlist();
    }
  });
});

wss.broadcast_keepalive();
