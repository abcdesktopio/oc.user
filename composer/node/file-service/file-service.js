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
const util = require('util');
const express = require('express');
const asyncHandler = require('express-async-handler');
const helmet = require('helmet');
const path = require('path');
const mkdirp = require('mkdirp');
const multer = require('multer');
const JSZip = require('jszip');

const { pipeline } = require('stream');

const {
  listenDaemonOnContainerIpAddr,
} = require('/composer/node/common-libraries/index.js');

const {
  middleWareFileQuery,
  middleWareFileBody,
  middlewareCheckFile,
  middleWareDirectoryQuery,
} = require('./middlewares');

const upload = multer({ storage: multer.memoryStorage() });

const exists = util.promisify(fs.exists);

// trust no one
// Hard code the home dir
// DO NOT CHANGE THIS FOR SECURITY
const rootdir = '/home/balloon';
const PORT = process.env.FILE_SERVICE_TCP_PORT || 29783;

console.log(`Root dir is ${rootdir}`);

function checkSafePath(currentPath) {
  let bReturn = false;
  try {
    const normalizedPath = path.normalize(currentPath);
    const pathObj = path.parse(normalizedPath);
    if (pathObj.dir.startsWith(rootdir) || currentPath === rootdir) {
      bReturn = true;
    }
  } catch (e) {
    console.error(e);
  }
  console.log(`checkSafePath return ${bReturn}`);
  return bReturn;
}

async function getNameTimeFile(file, dir) {
  const s = await fs.promises.stat(`${dir}/${file}`);
  return { name: file, time: s.mtime.getTime() };
}

async function getFilesSort(dir) {
  const files = await fs.promises.readdir(dir);
  const times = await Promise.all(
    files.map((file) => getNameTimeFile(file, dir)),
  );
  return times.sort((a, b) => a.time - b.time).map((v) => v.name);
}

async function dirExists(d) {
  try {
    const ls = await fs.promises.lstat(d);
    return ls.isDirectory();
  } catch (e) {
    console.error(e);
    return false;
  }
}

/**
 *
 * @param {string} file
 * @param {*} zip
 * @desc Generate a zip for a given file
 */
async function generateZipTree(file, zip) {
  try {
    const ls = await fs.promises.lstat(file);
    const parts = file.split('/');
    const filename = parts[parts.length - 1];
    if (ls.isDirectory()) {
      const folder = zip.folder(filename);
      const filesDirectory = await fs.promises.readdir(file);

      await Promise.all(
        filesDirectory.map((f) => generateZipTree(`${file}/${f}`, folder)),
      );
    } else {
      const buffer = await fs.promises.readFile(file, { encoding: 'binary' });
      zip.file(filename, buffer, { encoding: 'binary' });
    }
  } catch (e) {
    console.error(e);
  }
}

const app = express();
const router = express.Router();

app.use(helmet());

app.use(express.json());
app.use((req, _, next) => {
  console.log('method:', req.method, 'on', req.path);
  next();
});

/**
 * @swagger
 *
 * /:
 *   get:
 *     description: Get file from the home directory
 *     responses:
 *       '500':
 *         schema:
 *           type: object
 *           properties:
 *             code:
 *               type: integer
 *             data:
 *               string
 *       '403':
 *         schema:
 *           type: object
 *           properties:
 *             code:
 *               type: integer
 *             data:
 *               type: string
 *
 *       '404':
 *         schema:
 *           type: object
 *           properties:
 *             code:
 *               type: integer
 *             data:
 *               type: string
 */
router.get('/',
  middleWareFileQuery,
  asyncHandler(async (req, res) => {
    const { file } = req.query;
    console.log('file', file);
    if (!checkSafePath(file)) {
      res.status(400).send({ code: 400, data: 'Path Server Error' });
      return;
    }

    if (!(await exists(file))) {
      res.status(404).send({ code: 404, data: 'Not found' });
      return;
    }

    const ls = await fs.promises.lstat(file);
    if (!ls.isDirectory()) {
      pipeline(
        fs.createReadStream(file),
        res,
        (err) => {
          if (err) {
            console.error(err);
          }
          res.end();
        },
      );
      return;
    }

    const zip = new JSZip();
    await generateZipTree(file, zip);

    res.header(
      'Content-Disposition',
      `attachment; filename="${file}.zip"`,
    );
    res.setHeader('Content-Type', 'application/zip');

    pipeline(
      zip.generateNodeStream({
        type: 'nodebuffer',
        streamFiles: true,
        compressionOptions: {
          level: 9,
        },
      }),
      res,
      (err) => {
        if (err) {
          console.error(err);
        }
        res.end();
      },
    );
  }));

/**
 * @swagger
 *
 * /directory/list:
 *  get:
 *    description: List files in a given directory
 *    parameters:
 *    - in: query
 *      name: directoryName
 *      type: string
 *      required: true
 */
router.get('/directory/list',
  middleWareDirectoryQuery,
  asyncHandler(async (req, res) => {
    const { directory } = req.query;
    console.log('listing directory:', directory);

    // Check if the path is correct
    if (!checkSafePath(directory)) {
      res.status(400).send({ code: 400, data: 'Path Server Error' });
    } else if (!(await exists(directory))) {
      res.status(404).send({ code: 404, data: 'Not found' });
    } else {
      const ls = await fs.promises.lstat(directory);
      if (ls.isDirectory()) {
        res.status(200).send(await getFilesSort(directory));
      } else {
        res.status(403).send({ code: 403, data: `${directory} is not a directory` });
      }
    }
  }));

/**
 * @swagger
 *
 * /:
 *  post:
 *    description: Upload a file at a given path
 *    requestBody:
 *      content:
 *        shema:
 *          type: object
 *          properties:
 *            fullPath:
 *              type: string
 *
 *    responses:
 *      '500':
 *        schema:
 *          type: object
 *          properties:
 *            code:
 *              type: integer
 *            data:
 *              type: string
 *
 *      '200':
 *        schema:
 *          type: object
 *          properties:
 *            code:
 *              type: integer
 *            data:
 *              type: string
 *
 *      '403':
 *        schema:
 *          type: object
 *          properties:
 *            code:
 *              type: integer
 *            data:
 *              type: string
 */
router.post('/', [upload.single('file'), middlewareCheckFile],
  asyncHandler(async (req, res) => {
    const { file } = req;
    const { fullPath = '' } = req.body;
    const { originalname, buffer } = file;
    const ret = { code: 403, data: 'Forbiden bad path' };

    const saveTo = `${fullPath || rootdir}/${originalname}`;
    if (checkSafePath(saveTo)) {
      if (fullPath !== '' && !(await dirExists(fullPath))) {
        console.log(`Create dir${fullPath}`);
        await mkdirp(fullPath);
      }

      console.log(originalname, 'want to be save in', saveTo);
      console.log(`writing file ${saveTo}`);
      await fs.promises.writeFile(saveTo, buffer);
      console.log('Write done');
      ret.code = 200;
      ret.data = 'ok';
    }

    console.log(ret);
    res.status(ret.code).send(ret);
  }));

/**
 * @swagger
 * /:
 *   delete:
 *     description: Remove a given file wich is present in home directory
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *             - myFilename
 *             properties:
 *               myFilename:
 *                 type: string
 *     responses:
 *       '200':
 *        schema:
 *          type: object
 *          properties:
 *            code:
 *              type: integer
 *            data:
 *              type: string
 *
 *       '500':
 *         schema:
 *           type: object
 *           properties:
 *             code:
 *               type: integer
 *             data:
 *               type: strin
 *
 *       '404':
 *         schema:
 *           type: object
 *           properties:
 *             code:
 *               type: integer
 *             data:
 *               type: string
 *
 *       '403':
 *         schema:
 *           type: object
 *           properties:
 *             code:
 *               type: integer
 *             data:
 *               type: string
 *
 *       '400':
 *         schema:
 *           type: object
 *           properties:
 *             code:
 *               type: integer
 *             data:
 *               type: string
 */
router.delete('/',
  middleWareFileBody,
  asyncHandler(async (req, res) => {
    const { file } = req.body;
    const ret = { code: 400, data: 'Path server error' };
    console.log('file', file);
    console.log(`accessing file: ${file}`);

    // Check if the path is correct
    if (checkSafePath(file)) {
      if (await exists(file)) {
        await fs.promises.unlink(file);
        ret.code = 200;
        ret.data = 'ok';
      } else {
        ret.code = 404;
        ret.data = 'Not Found';
      }
    }

    res.status(ret.code).send(ret);
  }));

router.all('*', (req, res) => {
  const ret = {
    code: 404,
    data: `Can not ${req.method} ${req.path}`,
  };

  console.error(ret);
  res.send(ret);
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _) => {
  console.error(req.path);
  console.error(err.stack);
  console.error(err.field);
  res.status(500).send({ code: 500, data: 'Internal server error' });
});

app.use('/filer', router);

process.on('uncaughtException', (err) => {
  console.error(err.stack);
});

listenDaemonOnContainerIpAddr(app, PORT, 'File-Service listening for requests');
