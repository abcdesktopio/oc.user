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
const colorflow = require('./colorflow/colorflow');
const broadcast = require('./broadcast');
const { set } = require('./utils');
const middlewares = require('./middlewares');
const { roothomedir } = require('../global-values');
const exec = util.promisify(childProcess.exec);

const currentWallpaper = `${roothomedir}/.config/current_wallpaper`;


/**
 * 
 * convert a hexa string color '#RRGGBB' to RGBPercent dictionary 
 *
 * @param {string} hex
 * @param {bool} alpha
 */
function hexToRGBPercent(hex, alpha) {
    let r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);

    r = r / 255;
    g = g / 255;
    b = b / 255;
    if (alpha) {
	let a = alpha / 255;
        return { r:r, g:g, b:b, a:a };
    } else {
        return  { r:r, g:g, b:b };
    }
}


/**
 *
 * @param {string} color
 */
async function xsetroot(color) {
  const ret = { code: 500, data: '' };
  const command = `/composer/esetroot.sh "${color}"`;
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
  // const command = `/usr/bin/feh --bg-fill "${imgName}"`;
  // const command = `/usr/bin/feh --fullscreen --borderless --image-bg "${bgColor}" --bg-fill "${imgName}"`;
  const command = `/composer/esetroot.sh "${bgColor}" "${imgName}"`;
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
async function xfce4_esetroot(bgColor, imgName) {
  const ret = { code: 500, data: 'unknow error' };
  // const command = `Esetroot -bg "${bgColor}" -center -fit  "${imgName}"`;
  // const command = `/usr/bin/feh --bg-fill "${imgName}"`;
  // const command = `/usr/bin/feh --fullscreen --borderless --image-bg "${bgColor}" --bg-fill "${imgName}"`;
  const rgbPercent = hexToRGBPercent( bgColor );
  const command = `/composer/xfce4-esetroot.sh "${rgbPercent.r}" "${rgbPercent.g}" "${rgbPercent.b}" "${imgName}"`;
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
    const color = await colorflow(imgName);
    const { code, data } = await xfce4_esetroot( color, imgName );
    if (code === 200) {
      await set('currentImgColor', color);
      await broadcast.broadcastevent('display.setBackgroundBorderColor', color);

      ret.code = code;
      ret.data = { color: color, subData: data };
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

    const { code, data } = await xfce4_esetroot(color);
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
