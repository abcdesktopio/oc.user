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

/**
 * @typedef {Object} File
 * @property {String} path
 * @property {String} mimetype
 * @property {String} executablefilename
 * @property {String} icon
 * @property {String} name
 * @property {String} launch
 * @property {String} desktopfile
 */

const fs = require('fs');
const ini = require('ini');
const { remove: removeaccent } = require('diacritics');
const { spawn } = require('child_process');
const mime = require('mime-types');
const { extname } = require('path');
const { Magic, MAGIC_MIME_TYPE } = require('mmmagic');
const asyncHandler = require('express-async-handler');
const { promisify } = require('util');
const middlewares = require('./middlewares');
const { set, get } = require('./utils');
const { roothomedir } = require('../global-values');

const writeFile = promisify(fs.writeFile);
const readDir = promisify(fs.readdir);
const lstat = promisify(fs.lstat);
const magic = new Magic(MAGIC_MIME_TYPE);

/**
 *
 * @param {*} root
 * @param {*} options
 * @desc Search file in user directory
 * At each io we check if the request have been aborted and stop the function in that case,
 * thats prevent to to useless tasks
 */
async function filesearch(root = '', options = { maxfile: 64, keywords: '', files: [] }) {
  if (options.req.aborted || options.files.length >= options.maxfile) {
    return;
  }

  const names = (await readDir(root)).filter((n) => n[0] !== '.' && n[0] !== '~');
  if (options.req.aborted) {
    return;
  }

  const lstatPromises = names.filter((c) => c !== 'jetty').map((c) => lstat(`${root}/${c}`));
  const lstats = await Promise.all(lstatPromises);
  if (options.req.aborted) {
    return;
  }

  const namesLstats = names.map((name, i) => ({ name, l: lstats[i] }))
    .filter((nl) => !nl.l.isSymbolicLink());

  const files = namesLstats.filter((nl) => nl.l.isFile()).map((nl) => removeaccent(nl.name));
  const newFiles = files.filter((name) => name.search(options.keywords) !== -1)
    .map((name) => ({
      file: `${root}/${name}`,
      mime: mime.lookup(`${root}/${name}`),
    }));

  options.files.push(...newFiles);
  if (options.files.length >= options.maxfile) {
    return;
  }

  const directories = namesLstats.filter((nl) => nl.l.isDirectory()).map((nl) => nl.name);
  const promisesDirectories = directories.map((name) => filesearch(`${root}/${name}`, options));
  await Promise.all(promisesDirectories);
}

/**
 *
 * @param {string} _filename
 */
function getmimeforfile(_filename) {
  // if filename start with a /
  // nothing to do
  // if filename does not start with a /
  // add the root homedir
  const filename = _filename.charAt(0) === '/' ? _filename : `${roothomedir}/${_filename}`;

  return new Promise((resolve, reject) => {
    magic.detectFile(filename, (err, result) => {
      if (err) {
        reject(err);
      } else {
        let res;
        // Hack for zip file
        if (result === 'application/x-gzip') {
          const extension = extname(filename);
          try {
            res = mime.lookup(extension);
          } catch (e) {
            reject(e);
            return;
          }
        }
        console.log(res);
        resolve(res);
      }
    });
  });
}

/**
 * @param {Array<File>} list
 * @param {Function} callback
 * @desc Build .desktop files to run containerized applications
 */
async function generateDesktopFiles(list = []) {
  const ocrunpath = '/composer/node/ocrun/ocrun.js';
  for (const {
    mimetype,
    path,
    executablefilename,
    icon,
    name,
    launch,
    desktopfile,
  } of list) {
    if (mimetype
      && path
      && executablefilename
      && icon
      && name
      && launch
      && desktopfile) {
      const filepath = `/home/balloon/.local/share/applications/${desktopfile}`;

      const contentdesktop = {};
      contentdesktop.Name = name;
      contentdesktop.Exec = `/home/balloon/.local/share/applications/bin/${launch} %U`;
      contentdesktop.MimeType = `${mimetype.join(';')};`;
      contentdesktop.Type = 'Application';
      contentdesktop.Icon = `/home/balloon/.local/share/icons/${icon}`;
      try {
        fs.symlink(ocrunpath, `/home/balloon/.local/share/applications/bin/${launch}`, () => { });
        await writeFile(filepath, ini.stringify(contentdesktop, {
          section: 'Desktop Entry',
        }));

        // Add a quick file name based on the seconde part of the launch key
        const binaryFilename = launch.split('.');
        if (Array.isArray(binaryFilename) && binaryFilename.length > 1) {
          const binf = binaryFilename[1].toLowerCase();
          // a char or more must exists
          if (binf.length > 0) { fs.symlink(ocrunpath, `/home/balloon/.local/share/applications/bin/${binf}`, () => { }); }
        }
      } catch (e) {
        console.log(e);
      }
    }
  }

  const updateproc = spawn('update-desktop-database', [`${roothomedir}/.local/share/applications`]);
  updateproc.stderr.on('data', (data) => {
    console.log(`ps stderr: ${data}`);
  });

  return new Promise((resolve) => {
    updateproc.on('close', (code) => {
      if (code !== 0) {
        console.log(`ps process exited with code ${code}`);
      }
      resolve({ code: 200, data: 'OK' });
    });
  });
}

/**
 *
 * @param {string} filename
 */
function getappforfile(filename = '') {
  console.log('START findapplicationforfile ');
  console.log(`findapplicationforfile ${filename}`);
  // comand seems to be a data file
  const mimeopen = spawn('/composer/node/spawner-service/mimeopen', [filename]);
  let stdout = null;
  const file = filename;

  mimeopen.stdout.on('data', (output) => {
    console.log(output);
    stdout = output;
  });

  return new Promise((resolve) => {
    mimeopen.on('close', (code) => {
      const ret = { code: null, data: '' };
      if (code === 0) {
        const resp = String(stdout);
        const arr = resp.split(' ');
        const ucommand = arr.shift();
        const uargs = [];

        for (let i = 0; !file.startsWith(arr[i]) && i < arr.length; i++) {
          uargs.push(arr[i]);
        }

        console.log(ucommand);
        console.log(uargs);
        const result = {
          command: ucommand,
          args: uargs,
        };
        ret.code = 200;
        ret.data = result;
      } else {
        // Application not found for file type
        console.log(`mimeopen stdout ${stdout}`);
        console.log(`mimeopen exited with code ${code}`);
        ret.code = 404;
        ret.data = stdout;
      }
      resolve(ret);
    });
  });
}

/**
 *
 * @param {*} router
 */
function routerInit(router) {
  /**
   * @swagger
   *
   * /setDesktop:
   *  post:
   *    description: Store a data as json file in desktop
   *    requestBody:
   *      content:
   *        application/json:
   *          schema:
   *            type: object
   *            required:
   *            - key
   *            - value
   *            properties:
   *              key:
   *                type: string
   *              value:
   *                type: string
   *    produces:
   *      - application/json
   *    responses:
   *      '500':
   *        schema:
   *          $ref: '#/definitions/InternalError'
   *      '200':
   *        schema:
   *          $ref: '#/definitions/Success'
   */
  router.post('/setDesktop', middlewares.get('setDesktop'), asyncHandler(async (req, res) => {
    const { key = '', value = '' } = req.body;
    const ret = { code: 200, data: 'ok' };
    await set(key, value);
    res.status(ret.code).send(ret);
  }));

  /**
   * @swagger
   *
   * /getDesktop:
   *  get:
   *    description: Get a data stored as json file
   *    produces:
   *      - application/json
   *    parameters:
   *    - in: query
   *      required: true
   *      name: key
   *      schema:
   *        type: string
   *
   *    responses:
   *      '500':
   *        schema:
   *          $ref: '#/definitions/InternalError'
   *      '200':
   *        schema:
   *          properties:
   *            code:
   *              type: integer
   *            data:
   *              type: object
   */
  router.get('/getDesktop', middlewares.get('getDesktop'), asyncHandler(async (req, res) => {
    const { key = '' } = req.query;
    const ret = { code: 200, data: 'ok' };
    const { code, data } = await get(key);
    ret.code = code;
    ret.data = data;
    res.status(ret.code).send(ret);
  }));

  /**
   * @swagger
   *
   * definitions:
   *  MIME:
   *    type: object
   *    properties:
   *      data:
   *        type: object
   *
   * /getmimeforfile:
   *  get:
   *    description: Get a mime for a given filename
   *    produces:
   *      - application/json
   *    parameters:
   *    - in: query
   *      name: filename
   *      type: string
   *      required: true
   *    responses:
   *      '500':
   *        schema:
   *          $ref: '#/definitions/InternalError'
   *      '200':
   *        schema:
   *          $ref: '#/definitions/MIME'
   */
  router.get('/getmimeforfile', middlewares.get('getmimeforfile'), asyncHandler(async (req, res) => {
    const { filename = '' } = req.query;
    const ret = { code: 200, data: 'ok' };
    const result = await getmimeforfile(filename);
    ret.data = result;
    res.status(ret.code).send(ret.data);
  }));

  /**
   * @swagger
   *
   * /filesearch:
   *  get:
   *    description: Used for list files by dock
   *    produces:
   *      - application/json
   *    parameters:
   *    - in: query
   *      name: maxfile
   *      type: integer
   *      default: 64
   *    - in: query
   *      name: keywords
   *      type: string
   *      required: true
   *    responses:
   *      '500':
   *        schema:
   *          $ref: '#/definitions/InternalError'
   *      '200':
   *        schema:
   *          type: object
   *          properties:
   *            code:
   *              type: integer
   *            data:
   *              type: array
   *              items:
   *                type: object
   *                properties:
   *                  file:
   *                    type: string
   *                  mime:
   *                    type: string
   */
  router.get('/filesearch', middlewares.get('filesearch'), asyncHandler(async (req, res) => {
    const { maxfile = 64, keywords = '' } = req.query;
    const ret = {
      code: 200,
      data: [],
    };

    const options = {
      keywords,
      maxfile,
      req,
      files: ret.data,
    };

    await filesearch(roothomedir, options);
    ret.data = ret.data.slice(0, maxfile);
    // Prevent in case when the received file list is bigger than expected (maxfile)
    res.status(ret.code).send(ret);
  }));

  /**
   * @swagger
   *
   * /generateDesktopFiles:
   *  post:
   *    description: Build desktop files to run containerized applications
   *    requestBody:
   *      content:
   *        application/json:
   *          schema:
   *            type: object
   *            required:
   *            - list
   *            properties:
   *              list:
   *                type: array
   *                items:
   *                  type: object
   *                  properties:
   *                    mimetype:
   *                      type: string
   *                    path:
   *                      type: string
   *                    executablefilename:
   *                      type: string
   *                    icon:
   *                      type: string
   *                    name:
   *                      type: string
   *                    launch:
   *                      type: string
   *    produces:
   *      - application/json
   *    responses:
   *      '500':
   *        schema:
   *          $ref: '#/definitions/InternalError'
   *      '200':
   *        schema:
   *          $ref: '#/definitions/Success'
   */
  router.post('/generateDesktopFiles', middlewares.get('generateDesktopFiles'), asyncHandler(async (req, res) => {
    const { list = [] } = req.body;
    const ret = await generateDesktopFiles(list);
    res.status(ret.code).send(ret);
  }));

  /**
   * @swagger
   *
   * definitions:
   *   AppForFile:
   *      type: object
   *      properties:
   *        code:
   *          type: integer
   *        data:
   *          type: array
   *          items:
   *            type: object
   *            properties:
   *              command:
   *                type: string
   *              args:
   *                type: string
   * /getappforfile:
   *  get:
   *    description: Allow to get the app necessary
   *    produces:
   *      - application/json
   *    responses:
   *      '500':
   *        schema:
   *          $ref: '#/definitions/InternalError'
   *      '200':
   *        schema:
   *          $ref: '#/definitions/AppForFile'
   */
  router.get('/getappforfile', middlewares.get('getappforfile'), asyncHandler(async (req, res) => {
    const { filename = '' } = req.query;
    const ret = await getappforfile(filename);
    res.status(ret.code).send(ret);
  }));
}

module.exports = { routerInit };
