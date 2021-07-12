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
const wmctrljs = require('wmctrljs');
const asyncHandler = require('express-async-handler');
const { delay } = require('./utils');

const pathSocketCups = path.join('/', 'tmp', '.cups.sock');
const pathPulseSocket = path.join('/', 'tmp', '.pulse.sock');

/**
 * @param {string} pathSoket
 * @param {Function} onSocketCreated
 * @param {Function} onSocketDeleted
 * @desc Watch for the existence of a given socket.
 * When the file is created/removed the appropriate function is called.
 */
async function watchForASocket(pathSoket, onSocketCreated, onSocketDeleted) {
  let socketExist = false;

  const options = {
    persistent: true,
  };

  try {
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

      const ws = new WebSocketClient(buri, {
        host: process.env.CONTAINER_IP_ADDR,
      });
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

/**
 *
 * @param {string} signal
 */
async function broadcastwindowslist(signal = '') {
  if (signal === 'SIGUSR2') {
    await delay(1000); // Wait one second to be sur that X11 already close the window (dirty)
  }
  const windows = await wmctrljs.getWindowList();
  const frontWindows = windows.map((win) => ({
    id: win.win_id,
    pid: win.win_pid,
    wm_class: win.win_class,
    title: win.win_name,
    machine_name: win.win_client_machine,
  }));

  await broadcastevent('window.list', frontWindows);
}

function routerInit(router) {
  /**
   * @swagger
   * /broadcastwindowslist:
   *  post:
   *      description: Emit a broadcast with window list as data
   *      produces:
   *          - application/json
   *      responses:
   *          '500':
   *              schema:
   *                  $ref: '#/definitions/InternalError'
   *          '200':
   *              schema:
   *                  $ref: '#/definitions/Success'
   */
  router.post('/broadcastwindowslist', asyncHandler(async (_, res) => {
    const ret = { code: 200, data: 'ok' };
    await broadcastwindowslist();
    res.status(ret.code).send(ret);
  }));
}

watchForASocket(pathPulseSocket, async function handlerForPulseaudioSocket () {
  //Name the callback to be able of identify the caller of [configureWebRTCStream] function
  global.audioConf.pulseAudioSocketIsUp = true;
  try {
    await global.audioConf.configureWebRTCStream('handlerForPulseaudioSocket');
  } catch(e) {
    console.error(e);
  }
}, async () => {
  global.audioConf.pulseAudioSocketIsUp = false;
  try {
    await broadcastevent('speaker.available', false);
  } catch(e) {
    console.error(e);
  }
});

watchForASocket(pathSocketCups, async () => {
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

module.exports = { routerInit, broadcastevent, broadcastwindowslist };
