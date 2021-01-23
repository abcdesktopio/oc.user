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
const childProcess = require('child_process');
const util = require('util');
const asyncHandler = require('express-async-handler');
const middlewares = require('./middlewares');
const { spawnBroadwayProcess } = require('./process');
const { get, set, delay } = require('./utils');
const exec = util.promisify(childProcess.exec);
const socketPulseaudioPath = '/tmp/.pulse.sock';

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

    let pulseaudioSocketIsUp = false;
    const pactlCommand = `pactl -s ${socketPulseaudioPath}`;
    do {
      try {
        await fs.promises.access(socketPulseaudioPath, fs.constants.F_OK);
        pulseaudioSocketIsUp = true;
      } catch (e) {
        console.error(`Socket ${socketPulseaudioPath} is not available yet`);
        await delay(250);
      } finally {
        if (req.aborted) {
          res.end();
          return;
        }
      }
    } while (!pulseaudioSocketIsUp);

    // Check if pulseaudio already load the module-rtp-send
    const listsourceOutputsCommand = `${pactlCommand} list short source-outputs | awk '{print $4}'`;
    const { stdout: stdoutSources } = await exec(listsourceOutputsCommand);
    if (stdoutSources.replace('\n', '') !== 'module-rtp-send.c') {
      await exec(`${pactlCommand} load-module module-rtp-send source=rtp.monitor destination_ip=${destinationIp} port=${port} channels=1 format=alaw`);
    }

    // Check if pulseaudio use rtp as default sink
    const { stdout: stdoutInfo } = await exec(`${pactlCommand} info`);
    if (!stdoutInfo.includes('Default Sink: rtp')) {
      await exec(`${pactlCommand} set-default-sink rtp`);
    }

    res.status(200).send({ code: 200, data: 'ok' });
  }));
}

module.exports = { routerInit };
