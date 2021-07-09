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

const childProcess = require('child_process');
const util = require('util');
const path = require('path');
const asyncHandler = require('express-async-handler');
const middlewares = require('./middlewares');
const { spawnBroadwayProcess } = require('./process');
const { broadcastevent } = require('./broadcast');

const exec = util.promisify(childProcess.exec);
const pathPulseSocket = path.join('/', 'tmp', '.pulse.sock');

global.audioConf = {
  pulseAudioSocketIsUp: false,
  webRTCConfigurationReceived: false,
  webRTCConfigurationIsPending: false,
  webRTCConfigured: false,
  webRTCConfiguration: {
    destinationIp: '',
    port: '',
  },

  /**
   * @desc Configure pulse audio for emitting rtp stream to the Janus gateway
   * /!\ must be executed only if the webRTC configuration is received
   */
  async configureWebRTCStream(callerName = '[global]') {
    const { destinationIp, port } = this.webRTCConfiguration;
    const pactlCommand = `pactl -s ${pathPulseSocket}`;
    const functionCallerName = `[${callerName}]`;

    if (!this.webRTCConfigurationReceived) {
      console.log('The webRTC configuration has not been received yet', functionCallerName);
      return;
    }

    if (!this.pulseAudioSocketIsUp) {
      console.log('Pulseaudio socket is not up yet', functionCallerName);
      return;
    }

    if (this.webRTCConfigurationIsPending) {
      console.log('WebRTC configuration is actually in pending state', functionCallerName);
      return;
    }

    if (this.webRTCConfigured) {
      console.log('Pulseadio is already configured in webRTC mode', functionCallerName);
      return;
    }

    try {
      //If ever spawner as restarted the attribute 'webRTCConfigured' is at false then we need to make a double check
      const listModules = `${pactlCommand} list short modules | awk '{print $2}'`;
      const { stdout: stdoutModules } = await exec(listModules);
      console.log('stdoutModules', stdoutModules);
      if (stdoutModules.split('\n').includes('module-rtp-send')) {
        this.webRTCConfigured = true;
        console.log('Pulseaudio was configured in webRTC mode before the running of this spawner instance', functionCallerName);
        return;
      }
    } catch(e) {
      console.error('An error occured when attempting to communicate with Pulseaudio', functionCallerName);
      // In this case we just go a head and for configuring Pulseadio beacause it is possible that Pulseaudio is not configured yet
    }

    this.webRTCConfigurationIsPending = true;

    try { // Configuration steps
      await exec(`${pactlCommand} load-module module-rtp-send source=rtp.monitor destination_ip=${destinationIp} port=${port} channels=1 format=alaw`);
      await exec(`${pactlCommand} set-default-sink rtp`);
      this.webRTCConfigured = true;
    } catch(e) {
      this.webRTCConfigurationIsPending = false;
      console.error('An error occured when attempting to configure Pulseaudio', functionCallerName);
      throw e;
    }

    if (this.webRTCConfigured) {
      //If the Pulseaudio has been configured with the webRTC options so we notify the client side
      try {
        await broadcastevent('speaker.available', true);
      } catch(e) {
        console.error('Error when emitting broadcast event', functionCallerName);
        throw e;
      }
    }

    this.webRTCConfigurationIsPending = false;
    console.log('Pulseaudio was configured by', functionCallerName);
  },
};

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
  router.put('/configurePulse', middlewares.get('configurePulse'), asyncHandler(async function handlerForConfigurePulseEndpoint (req, res) {
    const { destinationIp, port } = req.body;

    global.audioConf.webRTCConfigurationReceived = true;
    global.audioConf.webRTCConfiguration = {
      destinationIp,
      port
    };

    if (!global.audioConf.webRTCConfigured) {
      await global.audioConf.configureWebRTCStream('handlerForConfigurePulseEndpoint');
    }

    const response = {
      code: 200,
      data: {
        pulseAudioIsConfigured: global.audioConf.webRTCConfigured,
        pulseAudioIsAvailable: global.audioConf.pulseAudioSocketIsUp,
      }
    };

    res.status(200).send(response);
  }));
}

module.exports = { routerInit };
