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

const fs = require('fs');
const path = require('path');
const WebSocketClient = require('ws');
const asyncHandler = require('express-async-handler');
const { delay } = require('./utils');
const globalValues = require('../global-values');
const pathSocketCups = globalValues.pathSocketCups;
const pathSocketPulse = globalValues.pathSocketPulse; 

/**
 * @param {string} pathSoket
 * @param {Function} onSocketCreated
 * @param {Function} onSocketDeleted
 * @desc Watch for the existence of a given socket.
 * When the file is created/removed the appropriate function is called.
 */
async function watchForASocket(pathSoket, onSocketCreated, onSocketDeleted) {
  let socketExist = false;

  console.log(`watchForASocket ${pathSoket} is starting`);
  const options = {
    persistent: true,
  };

  try {
    console.log(`fs.promises.access ${pathSoket} is checking for F_OK`);
    await fs.promises.access(pathSoket, fs.constants.F_OK);
    console.log(`Socket ${pathSoket} was up before the running of spawner`);
    socketExist = true;
    if (typeof onSocketCreated === 'function') {
      onSocketCreated();
    }
  } catch(e) {
    console.error(e);
  }

  console.log(`Listenning for event on socket ${pathSoket}`);
  fs.watchFile(pathSoket, options, (currentStat) => {
    if (socketExist && !currentStat.isSocket()) { //The socket has been removed
      socketExist = false;
      console.log(`Socket ${pathSoket} has been removed`);
      if (typeof onSocketDeleted === 'function') {
        onSocketDeleted();
      }
    } else if (!socketExist && currentStat.isSocket()) { //The socket has been created
      socketExist = true;
      console.log(`Socket ${pathSoket} has been created`);
      if (typeof onSocketCreated === 'function') {
        onSocketCreated();
      }
    }
  });
}

/**
 *
 * @param {string} method
 * @param {Object} data
 * @desc Emit a broadcast event
 */
function broadcastevent(method = '', data) {
  return new Promise((resolve, reject) => {
    try {
      const broadcastTcpPort = process.env.BROADCAST_SERVICE_TCP_PORT || 29784;
      const buri = `ws://${process.env.CONTAINER_IP_ADDR}:${broadcastTcpPort}`;
      const protocols = [];
      const ws = new WebSocketClient(buri, protocols, { host: process.env.CONTAINER_IP_ADDR });
      let dataSent = false;

      ws.on('open', () => {
        console.log('Connection to broadcast-service done !');
        try {
          const message = {
            method,
            data,
          };
          ws.send(JSON.stringify(message));
          dataSent = true;
        } catch (err) {
          console.error(err);
          reject(err);
        } finally {
          ws.close();
        }
      });

      ws.on('close', () => {
        if (dataSent) {
          console.log('Connection to broadcast-service closed !');
          resolve();
        } else {
          const error = 'Connection closed unexpectedly';
          console.error(error);
          reject(error);
        }
      });
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

function routerInit(router) {
  /**
   * @swagger
   */
}

watchForASocket(pathSocketPulse, async () => {
  console.log( 'handlerForPulseaudioSocket is starting' );
  try {
    console.log( 'sending broadcastevent(speaker.available, true)');
    await broadcastevent('speaker.available', true);
  } catch(e) {
    console.error(e);
  }
}, async () => {
  console.log( 'handlerForPulseaudioSocket has failed' );
  try {
    console.log( 'sending broadcastevent(speaker.available, false)');
    await broadcastevent('speaker.available', false);
  } catch(e) {
    console.error(e);
  }
});

watchForASocket(pathSocketCups, async () => {
  console.log( 'handlerForCupsSocket is starting' );
  try {
    await broadcastevent('printer.available', true);
  } catch(e) {
    console.error(e);
  }
}, async () => {
  try {
    await broadcastevent('printer.available', false);
  } catch(e) {
    console.error(e);
  }
});

module.exports = { routerInit, broadcastevent };
