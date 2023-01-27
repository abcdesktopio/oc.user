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
const covercolor = require('./covercolor');
const broadcast = require('./broadcast');
const { set } = require('./utils');
const middlewares = require('./middlewares');
const { roothomedir } = require('../global-values');
const exec = util.promisify(childProcess.exec);

const currentWallpaper = `${roothomedir}/.config/current_wallpaper`;

/**
 *
 * @param {string} color
 */
async function xsetroot(color) {
  const ret = { code: 500, data: '' };
  const command = `/usr/bin/xsetroot -solid "${color}"`;
  console.log(command);
  try {
    await exec(command);
    ret.code = 200;
    ret.data = 'ok';
  } catch (err) {
    console.error(err);
    ret.data = err;
  }
  return ret;
}

/**
 *
 * @param {string} imgName
 * @param {string} bgColor
 */
async function esetroot(imgName, bgColor) {
  const ret = { code: 500, data: 'unknow error' };
  // const command = `Esetroot -bg "${bgColor}" -center -fit  "${imgName}"`;
  const command = `/usr/bin/feh --bg-fill "${imgName}"`;
  console.log(command);
  try {
    await exec(command);
    ret.code = 200;
    ret.data = 'ok';
  } catch (err) {
    console.error(err);
    ret.data = err;
  }
  return ret;
}

/**
 *
 * @param {string} imgName
 */
async function changeBgImage(imgName = '') {
  const ret = { code: 500, data: '' };
  try {
    const color = await covercolor.covercolor(imgName);
    const col = covercolor.colortohashstring(color);
    const { code, data } = await esetroot(imgName, col);
    if (code === 200) {
      await set('currentImgColor', col);
      await broadcast.broadcastevent('display.setBackgroundBorderColor', col);

      ret.code = code;
      ret.data = { color: col, subData: data };
    }
  } catch (err) {
    ret.data = err;
  }
  return ret;
}

/**
 *
 * @param {*} router
 */
function routerInit(router) {
  /**
   * @swagger
   *
   * /setBackgroundColor:
   *   post:
   *     description: Change the background color
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *             - color
   *             properties:
   *               color:
   *                 type: string
   *
   *     produces:
   *       - application/json
   *     responses:
   *       '500':
   *         schema:
   *           $ref: '#/definitions/InternalError'
   *       '200':
   *         schema:
   *           $ref: '#/definitions/Success'
   *
   */
  router.post('/setBackgroundColor', middlewares.get('setBackgroundColor'), asyncHandler(async (req, res) => {
    const { color = '' } = req.body;
    const ret = { code: 500, data: '' };
    let currentWallPaperExist = false;
    try {
      await fs.promises.access(currentWallpaper, fs.constants.F_OK);
      currentWallPaperExist = true;
    } catch(e) {}

    if (currentWallPaperExist) {
      await fs.promises.unlink(currentWallpaper);
    }

    const { code, data } = await xsetroot(color);
    ret.code = code;
    ret.data = data;

    await broadcast.broadcastevent('display.setBackgroundBorderColor', color);

    res.status(ret.code).send(ret);
  }));

  /**
   * @swagger
   *
   * /setBackgroundImage:
   *   post:
   *     description: Set the background image
   *     produces:
   *       - application/json
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *             - imgName
   *             properties:
   *               imgName:
   *                 type: string
   *     responses:
   *       '500':
   *         schema:
   *           $ref: '#/definitions/InternalError'
   *       '404':
   *         schema:
   *           type: object
   *           properties:
   *             code:
   *               type: integer
   *             data:
   *               type: string
   *       '200':
   *         schema:
   *           properties:
   *             code:
   *               type: integer
   *             data:
   *               type: object
   *               properties:
   *                 color:
   *                   type: string
   *                 subData:
   *                   $ref: '#/definitions/Success'
  */
  router.post('/setBackgroundImage', middlewares.get('setBackgroundImage'), asyncHandler(async (req, res) => {
    const { imgName = '' } = req.body;
    const imgFullpath = `${roothomedir}/.wallpapers/${imgName}`;
    const ret = { code: 500, data: '' };
    let imageExist = false;
    try {
      await fs.promises.access(imgFullpath, fs.constants.F_OK);
      imageExist = true;
    } catch(e) {}
    
    if (!imageExist) {
      ret.code = 404;
      ret.data = `Unknow image ${imgName}`;
    } else {
      let currentWallPaperExist = false;
      try {
        await fs.promises.access(currentWallpaper, fs.constants.F_OK);
        currentWallPaperExist = true;
      } catch(e) {}

      if (currentWallPaperExist) {
        await fs.promises.unlink(currentWallpaper);
      }
      await fs.promises.link(imgFullpath, currentWallpaper);
      const { code, data } = await changeBgImage(imgFullpath);
      ret.code = code;
      ret.data = data;
    }

    res.status(ret.code).send(ret);
  }));

  /**
   * @swagger
   *
   * /setDefaultImage:
   *   post:
   *     description: Set the default image as background
   *     produces:
   *     - applcation/json
   *     responses:
   *       '500':
   *         schema:
   *           $ref: '#/definitions/InternalError'
   *       '200':
   *          schema:
   *            properties:
   *              code:
   *                type: integer
   *              data:
   *                type: string
   *       '404':
   *          schema:
   *            properties:
   *              code:
   *                type: integer
   *              data:
   *                type: string
   */
  router.post('/setDefaultImage', asyncHandler(async (_, res) => {
    const ret = { code: 404, data: 'file not found' };
    let currentWallPaperExist = false;
    try {
      await fs.promises.access(currentWallpaper, fs.constants.F_OK);
      currentWallPaperExist = true;
    } catch(e) {}

    if (currentWallPaperExist) {
      const { code, data } = await changeBgImage(currentWallpaper);
      ret.code = code;
      ret.data = data;
    }

    res.status(ret.code).send(ret);
  }));
}

module.exports = { routerInit };
