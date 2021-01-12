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

const WebSocketClient = require('ws');

const buri = `ws://${process.env.CONTAINER_IP}:29784`;

async function* messageQueueTest() {
  const ws = new WebSocketClient(buri);

  yield new Promise((resolve, reject) => {
    ws.on('open', () => {
      resolve();
    });

    ws.on('error', (error) => {
      reject(error);
    });
  });

  const messages = { 1: null };
  yield new Promise((resolve) => {
    ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg);
        if (data.method !== 'broadcast keep_alive' && data.method !== 'connect.counter') {
          messages[1] = data;
          resolve(messages);
          ws.close();
        }
      } catch (e) {
        console.error(e);
      }
    });
  });

  ws.on('close', () => {
    console.log('Connection Closed');
  });
}

function sendMessage(msg) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocketClient(buri);
    ws.on('open', () => {
      resolve();
      ws.send(typeof msg === 'object' ? JSON.stringify(msg) : msg);
      ws.close();
    });
    ws.on('error', (err) => {
      reject(err);
    });
  });
}

describe('Test broadcast-serivce', () => {
  const datas = [
    {
      method: 'hello',
      data: 'hello',
    },
    {
      method: 'proc.killed',
    },
    {
      method: 'proc.started',
    },
    {
      method: 'window.list',
    },
    {
      method: 'printer.new',
    },
    {
      method: 'display.setBackgroundBorderColor',
    },
    {
      method: 'ocrun',
    },
    {
      method: 'logout',
    },
  ];

  for (const data of datas) {
    it(`Should send data ${typeof data === 'string' ? data : JSON.stringify(data)}`, async () => {
      const expected = { 1: data };
      const testGen = messageQueueTest();
      await testGen.next();

      // Connected
      const [{ value: messages }] = await Promise.all([
        testGen.next(),
        sendMessage(data),
      ]);
      expect(messages).toEqual(expected);
    });
  }
});
