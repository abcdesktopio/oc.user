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
const { remove: removeaccent } = require('diacritics');
const { spawn } = require('child_process');
const mime = require('mime-types');
const { extname } = require('path');
const { Magic, MAGIC_MIME_TYPE } = require('mmmagic');
const asyncHandler = require('express-async-handler');
const ini = require('./ini');
const middlewares = require('./middlewares');
const { set, get } = require('./utils');
const { roothomedir } = require('../global-values');

const magic = new Magic(MAGIC_MIME_TYPE);

/**
 * 
 * @param {string} root 
 * @param {string} keywords 
 */
async function* filesearch(root = '', keywords = '') {
  const dirents = await fs.promises.readdir(root, { withFileTypes: true });
  const files = [];
  const directories = [];

  for (const dirent of dirents) {
    if (dirent.isSymbolicLink() || dirent.name[0] === '.') {
      continue;
    }

    if (dirent.isDirectory()) {
      directories.push(dirent.name);
    } else if (
        dirent.isFile()
        && dirent.name[0] !== '~'
        && dirent.name !== 'jetty' // Disable Eclipse
        ) {
        const filenameWithoutAccent = removeaccent(dirent.name);
        if (filenameWithoutAccent.search(keywords) !== -1) {
          const filepath = `${root}/${dirent.name}`;
          files.push({
            file: filepath,
            mime: mime.lookup(filepath),
          });
        }
    }
  }

  // Render files to caller function item by item
  yield* files;

  for (const directory of directories) {
    // Catch n+1 filesearch rendering
    yield* filesearch(`${root}/${directory}`, keywords);
  }
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
  console.log('generateDesktopFiles');
  console.log(`list of application len is ${list.length}`);	
  const ocrunpath = '/composer/node/ocrun/ocrun.js';
  for ( let {
    mimetype,
    path,
    executablefilename,
    execmode,
    icon,
    icondata,
    icon_url,
    name,
    launch,
    desktopfile,
  } of list) {
    console.log(`application name=${name}`);
    if ( path
      && executablefilename
      && icon
      && name
      && launch ) {

      // check if desktopfile has been define
      if (!desktopfile) {
	// if the desktopfile is not defined by the application metadata, we create a new one
	desktopfile = `${launch}.desktop`;
      }
      if (!name) {
        name = launch;
      }
      if (!execmode) {
        execmode = 'container';
      }
      const filepath = `${roothomedir}/.local/share/applications/${desktopfile}`;
      console.log(`creating a new desktop file ${filepath} for application name=${name}` ); 
      const contentdesktop = {};
      contentdesktop.Name = name;
      contentdesktop.Exec = `${roothomedir}/.local/share/applications/bin/${launch} %U`;
      if (mimetype && mimetype.length > 0)
        contentdesktop.MimeType = `${mimetype.join(';')};`;
      contentdesktop.Type = 'Application';
      contentdesktop.Icon = `${roothomedir}/.local/share/icons/${icon}`;
      try {
        fs.symlink(ocrunpath, `${roothomedir}/.local/share/applications/bin/${launch}`, () => {});
        await fs.promises.writeFile(filepath, ini.stringify(contentdesktop, {
          section: 'Desktop Entry',
        }));

        // Add a quick file name based on the seconde part of the launch key
        // const binaryFilename = launch.split('.');
        // if (Array.isArray(binaryFilename) && binaryFilename.length > 1) {
        //  const binf = binaryFilename[1].toLowerCase();
        //  // a char or more must exists
        //  if (binf.length > 0) { fs.symlink(ocrunpath, `/home/balloon/.local/share/applications/bin/${binf}`, () => { }); }
        // }
      } catch (e) {
        console.log(e);
      }
      
      fs.access(contentdesktop.Icon, fs.F_OK, (err) => {
        // console.log(err);
        // file does not exists
        // decode base64 data it
        if (err) {
        if (icondata) {
            console.log( 'writing new icon file ' + contentdesktop.Icon );
            fs.writeFile(   contentdesktop.Icon, 
                            icondata,
                            'base64',
                            (err) => {
                                if (err)
                                    console.log('error in write icon file ' + contentdesktop.Icon + ' ' + err);
                            } 
            );
        }
        else
            console.log( 'Icon data is null for file ' + contentdesktop.Icon );
        }
      });

    }
  }
  
  // All desktop files are created in ${roothomedir}/.local/share/applications 
  // run update-desktop-database 
  const updateproc = spawn('update-desktop-database', [`${roothomedir}/.local/share/applications`]);
  
  // on stderr log error
  updateproc.stderr.on('data', (data) => {
    console.log(`update-desktop-database stderr: ${data}`);
  });

  // on exit log exit code
  updateproc.on('close', (code) => {
        console.log(`update-desktop-database process exited with code ${code}`);
  });

  // don't wait for updateproc
  // return 200 asap
  return Promise.resolve({ code: 200, data: 'OK' });
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
    const ret = { code: 500, data: 'error' };
    const { code, data } = await set(key, value);
    ret.code = code;
    ret.data = data;
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

    const files = [];

    for await (const filename of filesearch(roothomedir, removeaccent(keywords))) {
      if (req.aborted) {
        break;
      }

      files.push(filename);

      if (files.length > maxfile) {
        break;
      }
    }

    ret.data = files;
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
