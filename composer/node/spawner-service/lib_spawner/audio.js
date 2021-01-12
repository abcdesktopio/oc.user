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

const { spawn } = require('child_process');
const asyncHandler = require('express-async-handler');
const middlewares = require('./middlewares');
const { spawnBroadwayProcess } = require('./process');
const { get, set, delay } = require('./utils');

/**
 *
 * @param {string} sink Sink pulseaudio
 * @param {Function} callback
 * @desc Run pactl command
 */
function setAudioQuality(sink = '', callback) {
  const command = 'pactl';
  const args = ['set-default-sink', sink];
  const ret = spawnBroadwayProcess(command, args);
  callback({
    code: ret.code,
    data: ret.data,
  });
}

function routerInit(router) {
  /**
   * @swagger
   * /setAudioQuality:
   *    post:
   *      description: Set the audio quality
   *      produces:
   *        - application/json
   *      requestBody:
   *        content:
   *          application/json:
   *            schema:
   *              type: object
   *              required:
   *              - sink
   *              properties:
   *                sink:
   *                  type: string
   *      responses:
   *        '500':
   *          schema:
   *            $ref: '#/definitions/InternalError'
   *        '200':
   *          schema:
   *            $ref: '#/definitions/processResult'
   */
  router.post('/setAudioQuality', middlewares.get('setAudioQuality'), (req, res) => {
    const { sink = '' } = req.body;
    setAudioQuality(sink, (data) => {
      res.send(data);
    });
  });

  /**
   * @swagger
   *
   * /configurePulse:
   *   put:
   *     description: Configure pulse audio for Janus
   *     produces:
   *       - application/json
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *             - destinationIp
   *             - port
   *             properties:
   *               destinationIp:
   *                 type: string
   *               port:
   *                 type: string
   *     responses:
   *       '500':
   *         schema:
   *           $ref: '#/definitions/InternalError'
   *       '200':
   *         schema:
   *           $ref: '#/definitions/Success'
   */
  router.put('/configurePulse', asyncHandler(async (req, res) => {
    const { destinationIp, port } = req.body;
    const ret = await get('configurePulse');
    if (ret.code === 404) {
      const pacmd = spawn('pacmd');
      await delay(3);
      pacmd.stdin.write('load-module module-null-sink sink_name=rtp format=alaw channels=1 rate=8000 sink_properties="device.description=\'RTP Multicast Sink\'"\n', 'utf-8');
      await delay(3);
      pacmd.stdin.write(`load-module module-rtp-send source=rtp.monitor destination_ip=${destinationIp}  port=${port} channels=1 format=alaw\n`, 'utf-8');
      await delay(3);
      pacmd.stdin.write('set-default-sink rtp\n', 'utf-8');
      await delay(3);
      pacmd.stdin.end();
      pacmd.kill();
      await set('configurePulse', 'done');
    }

    res.status(200).send({ code: 200, data: 'ok' });
  }));
}

module.exports = { routerInit };
