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
const {
  spawn,
  spawnSync
} = require('child_process');
const process = require('process');

const os = require('os');
const geoip = require('geoip-lite');
const asyncHandler = require('express-async-handler');

const parser = require('accept-language-parser');
const globalValues = require('../global-values');

/**
 * @typedef {Object<>} OptionBroadwayProcess
 * @property {callback} callback
 * @property {boolean} sync
 * @property {number} timeout
*/
function getProcessEnv() {
  const obj = {};
  const envList = [
    'POD_NAMESPACE',
    'POD_NAME',
    'NODE_NAME'
  ];
  
  envList.forEach((env) => {
    obj[env] = process.env[env] ? process.env[env] : '';
  });

  return obj;
}

/**
 * @param {string} clientIpAddr
 */
function getCountry(clientIpAddr) {
  let country = null;

  try {
    const geo = geoip.lookup(clientIpAddr);
    country = geo.country;
  } catch (e) { country = null; }
  return country;
}

/**
 *
 */
function getEnvDefault() {
  const l = globalValues.language;
  const lUtf8 = `${l}.UTF-8`;

  console.log(`getEnvDefault: language is: ${globalValues.language}`);
  const roothomedir=globalValues.roothomedir;

  // override env
  const env = {
    DISPLAY: ':0',
    UBUNTU_MENUPROXY: '0',
    LIBOVERLAY_SCROLLBAR: '0',
    SHELL: '/bin/bash',
    PATH: `/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:${roothomedir}/.local/share/applications/bin`,
    UID: 4096,
    EUID: 4096,
    LANGUAGE: l,
    LANG: lUtf8,
    LC_ALL: lUtf8,
    LC_PAPER: lUtf8,
    LC_ADDRESS: lUtf8,
    LC_MONETARY: lUtf8,
    LC_MEASUREMENT: lUtf8,
    LC_IDENTIFICATION: lUtf8,
    LC_TELEPHONE: lUtf8,
    LC_NUMERIC: lUtf8,
    LC_NAME: lUtf8,
    LC_TIME: lUtf8,
  };

  return env;
}

/**
 *
 * @param {string} command
 * @param {string[]} args
 * @param {OptionBroadwayProcess} options
 */
function spawnBroadwayProcess(
  command,
  args = [],
  options = {
    callback: () => { },
    sync: false,
    timeout: 1000,
  },
) {
  let ret;

  // build an env object with language
  const env = getEnvDefault();

  // override env with env defined
  const myprocess = {
    env: {
      ...process.env,
      ...env,
    },
  };

  // Convert list of arguments into a simple array
  // used by nodejs spawn call
  const aargs = [...args];
  const roothomedir=globalValues.roothomedir;

  console.log('spawn command: %s %s', command, aargs.toString());
  try {
    let cmd;
    const cmdOptions = {
      env: myprocess.env,
      cwd: roothomedir,
    };

    if (options.sync) {
      cmdOptions.timeout = options.timeout;
      cmd = spawnSync(command, aargs, cmdOptions);
    } else {
      cmd = spawn(command, aargs, cmdOptions);
      console.log(` cmd.pid : ${cmd.pid}`);
      console.log(` cmd.spawnfile : ${cmd.spawnfile}`);
      console.log(` cmd.spawnargs : ${cmd.spawnargs}`);
      cmd.on('close', (code) => {
        options.callback(ret, code);
      });
    }

    // cmd can be defined but
    // cmd.pid is undefined if the command path does not exit
    // check both cmd and cmd.pid

    if (cmd) {
      const mycmd = {
        command,
        args: aargs,
      };
      ret = {
        code: 200,
        data: mycmd,
        proc: cmd,
      };
    } else {
      const message = `start process failed ${command} ${aargs.toString()}`;
      ret = {
        code: 500,
        data: message,
      };
    }
  } catch (e) {
    const message = `start process failed ${e}`;
    ret = {
      code: 500,
      data: message,
    };
  }

  console.log('spawnBroadwayProcess :');
  console.log(`return ret.code : ${ret.code}`);
  console.log(`return ret.data : ${ret.data}`);
  return ret;
}

/**
 *
 * @param {string} clientIpAddr
 */
async function about(clientIpAddr) {
  const country = getCountry(clientIpAddr);
  // read date in /etc/build.date

  const jsonres = {};
  jsonres.hostname = os.hostname();
  jsonres.ipaddr = os.networkInterfaces().eth0[0].address;
  jsonres.platform = os.platform();
  jsonres.arch = os.arch();
  jsonres.release = os.release();
  jsonres.cpu = os.cpus()[0].model;
  jsonres.clientipaddr = clientIpAddr;
  jsonres.country = country || 'default value';
  jsonres.language = globalValues.language || 'default value';

  try {
    jsonres.build = await fs.promises.readFile('/etc/build.date', 'utf8');
  } catch (error) {
    jsonres.build = 'not set';
  }

  return { ...jsonres, ...getProcessEnv() };
}

/**
 *
 * @param {*} err
 * @param {*} command
 * @param {*} args
 */
function callbackExec(err, command, args) {
  return new Promise((resolve, reject) => {
    if (err) {
      console.error('callbackExec error ', err);
      const ret = {
        code: 500,
        data: err,
      };
      const error = new Error({
        code: ret.code,
        data: ret.data,
      });
      reject(error);
    } else {
      const ret = spawnBroadwayProcess(command, args);
      resolve(ret);
    }
  });
}

/**
 *
 * @param {*} httpHeaderAcceptLanguage
 */
function setCultureInfo(httpHeaderAcceptLanguage) {
  if (!httpHeaderAcceptLanguage) {
    return;
  }

  try {
    const parserlanguage = parser.parse(httpHeaderAcceptLanguage);
    for (const pl of parserlanguage) {
      const { code, region } = pl;
      if (code && region) {
        for (const suportedLanguage of globalValues.supportedLanguages) {
          if (suportedLanguage === code) {
            globalValues.language = `${code}_${region}`;
            console.log(`setCultureInfo${globalValues.language}`);
            return;
          }
        }
      }
    }
  } catch (e) { console.error(e); }
}

/**
 *
 * @param {*} router
 */
function routerInit(router) {
  /**
   * @swagger
   *
   * /about:
   *   get:
   *     description: Get system informations
   *     produces:
   *       - application/json
   *     responses:
   *       '500':
   *         schema:
   *           $ref: '#/definitions/InternalError'
   *       '200':
   *         schema:
   *          type: object
   *          properties:
   *            hostname:
   *              type: string
   *            ipaddr:
   *              type: string
   *            plateform:
   *              type: string
   *            arch:
   *              type: string
   *            release:
   *              type: string
   *            cpu:
   *              type: string
   *            clientipaddr:
   *              type: string
   *            country:
   *              type: string
   *            language:
   *              type: string
   *            build:
   *              type: string
   *            POD_NAMESPACE:
   *              type: string
   *            POD_NAME:
   *              type: string
   *            NODE_NAME:
   *              type: string
   *            POD_IP:
   *              type: string
   *            KUBERNETES_SERVICE_HOST:
   *              type: string
   */
  router.get('/about', asyncHandler(async (req, res) => {
    let clientIpAddr;
    try {
      clientIpAddr = req.headers['x-forwarded-for'];
    } catch (e) {
      console.log(e);
      clientIpAddr = 'not set';
    }

    setCultureInfo(req.headers['accept-language']);

    const jsonres = await about(clientIpAddr);
    res.send(jsonres);
  }));

  router.post('/kill', (req, res) => {
    const { pid } = req.body;
    process.kill(pid, 9);
    const ret = { code: 200, data: 'ok' };
    res.status(ret.code).send(ret);
  });

  /**
   * @swagger
   *
   * /getSettings:
   *   get:
   *     description: Get configuration for settings window
   *     produces:
   *       - application/json
   *     responses:
   *       '500':
   *          schema:
   *            $ref: '#/definitions/InternalError'
   *       '200':
   *          schema:
   *            type: object
   *            properties:
   *              code:
   *                type: integer
   *              data:
   *                type: array
   *                items:
   *                  properties:
   *                    tab:
   *                      type: string
   *                    enabled:
   *                      type: boolean
   */
  router.get('/getSettings', asyncHandler(async (_, res) => {
    const pathPulseSock = '/tmp/.pulse.sock';
    const pathCupsSock = '/tmp/.cups.sock';
    const ret = {
      code: 500,
      data: [
        {
          tab: 'audio',
          enabled: false,
        },
        {
          tab: 'printers',
          enabled: false,
        },
      ],
    };
    const [audio, printers] = ret.data;

    try {
      await fs.promises.access(pathPulseSock, fs.constants.F_OK);
      const statPulseSock = await fs.promises.lstat(pathPulseSock);
      if (statPulseSock.isSocket()) {
        audio.enabled = true;
      }
    } catch(e) {
      console.error(e);
    }

    try {
      await fs.promises.access(pathCupsSock, fs.constants.F_OK);
      const statCupsSock = await fs.promises.lstat(pathCupsSock);
      if (statCupsSock.isSocket()) {
        printers.enabled = true;
      }
    } catch(e) {
      console.error(e);
    }

    ret.code = 200;

    ret.data = ret.data
      .filter((o) => o.enabled)
      .map((o) => o.tab);

    res.status(ret.code).send(ret);
  }));
}

module.exports = {
  spawnBroadwayProcess,
  setCultureInfo,
  callbackExec,
  routerInit,
};
