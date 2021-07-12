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

const { body, query } = require('express-validator');
const wmctrljs = require('wmctrljs');
const { getFinalMiddlewares } = require('oc.user.libraries/middlewares');
const { applist } = require('../global-values');

const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

/* SUMMARY
* exist -> Check if the field is presents in the body
* [checkNull:true] consider values as null doesn't exists
* bail -> Stop validation if any of previous validation failed
* isIn -> check if the value is in an array
*/

const numberValidor = (value, properties) => {
  if (typeof value !== 'number') {
    throw new Error(`${capitalizeFirstLetter(properties.path)} must be a number`);
  }
  return true;
};

const middlewareWindowPid = body('pid')
  .exists({ checkNull: true })
  .withMessage('No pid provided')
  .bail()
  .custom(numberValidor)
  .withMessage('Pid must be a number')
  .bail();

const middlewareWindowid = body('windowid')
  .exists({ checkNull: true })
  .withMessage('No windowid provided')
  .bail()
  .custom(numberValidor)
  .withMessage('Windowid must be a number')
  .bail()
  .custom((winId) => {
    let lWinId;
    try {
      lWinId = wmctrljs.getWindowListSync().map((win) => win.win_id);
    } catch (e) {
      console.error(e);
      lWinId = [];
    }

    if (!lWinId.includes(winId)) {
      throw new Error('Unknow windowid');
    }
    return true;
  });

const middlewareWindowsid = body('windowsid')
  .exists({ checkNull: true })
  .withMessage('No windowsid provided')
  .bail()
  .isArray({ min: 1 })
  .withMessage('Windowsid must be an array of windowid not empty')
  .bail()
  .custom((array) => {
    if (array.some((v) => typeof v !== 'number')) {
      throw new Error('All windowsid must be number');
    }

    let lWinId;
    try {
      lWinId = wmctrljs.getWindowListSync().map((win) => win.win_id);
    } catch (e) {
      console.error(e);
      lWinId = [];
    }

    for (const wi of array) {
      if (!lWinId.includes(wi)) {
        throw new Error(`Unknow window_id [${wi}]`);
      }
    }

    return true;
  });

const middlewareMail = body('mail')
  .exists({ checkNull: true })
  .withMessage('No mail provided')
  .bail()
  .isString()
  .isEmail()
  .withMessage('Bad mail pattern');

const middlewareName = body('name')
  .exists({ checkNull: true })
  .withMessage('No name provided')
  .bail()
  .isString()
  .withMessage('Bad name pattern');

const middlewareColor = body('color')
  .exists({ checkNull: true })
  .withMessage('No color provided')
  .bail()
  .isString()
  .withMessage('Color must be a string')
  .bail()
  .isHexColor()
  .withMessage('Color must be a string hexa')
  .bail()
  .matches(/^(#{1})([0-9A-F]{8}|[0-9A-F]{6})$/i)
  .withMessage('Bad color hexa pattern');

const middlewareImgname = body('imgName')
  .exists({ checkNull: true })
  .withMessage('No imgName provided')
  .bail()
  .isString()
  .withMessage('imgName must be a string');

const middlewareTheme = body('theme')
  .exists({ checkNull: true })
  .withMessage('No theme provided')
  .bail()
  .isString()
  .matches(/^[a-z]{4,10}$/i)
  .withMessage('Bad theme pattern');

const middlewareKey = body('key')
  .exists({ checkNull: true })
  .withMessage('No key provided')
  .bail()
  .isString()
  .withMessage('Key must be a string');

const middlewareKeyQuery = query('key')
  .exists({ checkNull: true })
  .withMessage('No key provided')
  .bail()
  .isString()
  .withMessage('Key must be a string')
  .bail()
  .notEmpty()
  .withMessage('Key must not be empty')
  .bail()
  .custom((key) => {
    if (key.replace(/\s/g, '') === '') {
      throw new Error('Key must have a valid pattern');
    }
    return true;
  });

const middlewareValue = body('value')
  .exists({ checkNull: true })
  .withMessage('No value provided')
  .bail()
  .isString()
  .withMessage('Value must be a string');

const middlewareFilename = body('filename')
  .exists({ checkNull: true })
  .withMessage('No filename provided')
  .bail()
  .isString()
  .withMessage('Bad filename pattern');

const middlewareMaxfile = query('maxfile')
  .exists({ checkNull: true })
  .withMessage('No maxfile provided')
  .bail()
  .isInt({ min: 1 })
  .withMessage('Maxfile must be a strictly positive number');

const middlewareKeywords = query('keywords')
  .exists({ checkNull: true })
  .withMessage('No keywords provided')
  .bail()
  .isString()
  .withMessage('Bad keywords pattern');

const middlewareList = body('list')
  .exists({ checkFalsy: true })
  .withMessage('No list provided')
  .isArray({ min: 1 })
  .withMessage('List must be a non-empty array');

const middlewareSink = body('sink')
  .exists({ checkNull: true })
  .withMessage('No sink provided')
  .bail()
  .isString()
  .withMessage('Sink must be a string');

const middlewareFilenameQuery = query('filename')
  .exists({ checkNull: true })
  .withMessage('No filename provided')
  .bail()
  .isString()
  .withMessage('filename must be a string');

const middlewareCommand = body('command')
  .exists({ checkNull: true })
  .withMessage('No command provided')
  .bail()
  .isString()
  .withMessage('Command must be a string')
  .bail()
  .custom((cmdName) => {
    const cmdsNames = applist.map((app) => app.key);
    if (!cmdsNames.includes(cmdName)) {
      throw new Error('Command must be a valid handled command');
    }
    return true;
  })
  .bail();

const middlewareArgs = body('args')
  .exists({ checkNull: true })
  .withMessage('No args provided')
  .bail()
  .isArray({ min: 1 })
  .withMessage('Args must be an array of string not empty')
  .bail()
  .custom((args) => {
    for (const arg of args) {
      if (!(arg instanceof String)) {
        throw new Error('Args must be an array of string not empty');
      }
    }

    return true;
  })
  .bail();

const destinationIp = body('destinationIp')
  .exists({ checkNull: true })
  .withMessage('No destinationIp provided')
  .bail()
  .isString()
  .withMessage('destinationIp must be a string')
  .bail()
  .isIP(4)
  .withMessage('destinationIp must be an ipV4 address')
  .bail();

const port = body('port')
  .exists({ checkNull: true })
  .withMessage('No port provided')
  .bail()
  .isNumeric()
  .withMessage('port must be a number')
  .bail();

/**
 * @type {Map<string, Array<Function>>} middlewares
 */
const dicoMiddlewares = new Map();

// -----AUDIO MODULE
dicoMiddlewares.set('setAudioQuality', getFinalMiddlewares(middlewareSink));
dicoMiddlewares.set('configurePulse', getFinalMiddlewares([destinationIp, port]));

// -----APP MODULE
dicoMiddlewares.set('launch', getFinalMiddlewares([middlewareCommand, middlewareArgs.optional()]));

// -----BROADCAST MODULE
dicoMiddlewares.set('echo', getFinalMiddlewares(middlewareValue));

// -----DESKTOP MODULE
dicoMiddlewares.set('setDesktop', getFinalMiddlewares([middlewareKey, middlewareValue]));
dicoMiddlewares.set('getDesktop', getFinalMiddlewares(middlewareKeyQuery));
dicoMiddlewares.set('getmimeforfile', getFinalMiddlewares(middlewareFilename));
dicoMiddlewares.set('filesearch', getFinalMiddlewares([middlewareKeywords, middlewareMaxfile.optional()]));
dicoMiddlewares.set('generateDesktopFiles', getFinalMiddlewares(middlewareList));
dicoMiddlewares.set('getappforfile', getFinalMiddlewares(middlewareFilenameQuery));

// -----PROCESS MODULE
dicoMiddlewares.set('kill', getFinalMiddlewares(middlewareWindowPid));

// -----SCREEN MODE MODULE
dicoMiddlewares.set('setBackgroundColor', getFinalMiddlewares(middlewareColor));
dicoMiddlewares.set('setBackgroundImage', getFinalMiddlewares(middlewareImgname));
dicoMiddlewares.set('setTheme', getFinalMiddlewares(middlewareTheme));

// -----USER INFO MODULE
dicoMiddlewares.set('getUserByMail', getFinalMiddlewares(middlewareMail));
dicoMiddlewares.set('searchContactByName', getFinalMiddlewares(middlewareName));

// -----WINDOW MODULE
dicoMiddlewares.set('activatewindows', getFinalMiddlewares(middlewareWindowsid));
dicoMiddlewares.set('closewindows', getFinalMiddlewares(middlewareWindowsid));
dicoMiddlewares.set('minimizewindow', getFinalMiddlewares(middlewareWindowid));
dicoMiddlewares.set('raisewindow', getFinalMiddlewares(middlewareWindowid));
module.exports = dicoMiddlewares;
