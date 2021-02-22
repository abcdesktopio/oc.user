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
 * @swagger
 *
 * definitions:
 *  InternalError:
 *    type: object
 *    properties:
 *      code:
 *        type: integer
 *      data:
 *        type: string
 *  Success:
 *    description: All operations completed with success
 *    type: object
 *    properties:
 *      code:
 *        type: integer
 *      data:
 *        type: string
 *
 *  processResult:
 *    type: object
 *    properties:
 *      code:
 *        type: integer
 *      data:
 *        type: object
*/

const fs = require('fs');
const utils = require('util');
const express = require('express');
const asyncHandler = require('express-async-handler');
const screen = require('./screen-mode');
const app = require('./app');
const audio = require('./audio');
const clipboard = require('./clipboard');
const window = require('./window');
const process = require('./process');
const desktop = require('./desktop');
const broadcast = require('./broadcast');
const { pathVersion } = require('../global-values');

const router = express.Router();

const exists = utils.promisify(fs.exists);
const readFile = utils.promisify(fs.readFile);

router.use((_, res, next) => {
  res.type('application/json');
  next();
});

router.use(express.json({ limit: '500mb' }));

/**
 * @swagger
 * /version:
 *    get:
 *      description: Get User container version
 *      produces:
 *      - application/json
 *      responses:
 *        '500':
 *          schema:
 *            $ref: '#/definitions/InternalError'
 *        '404':
 *          schema:
 *            type: object
 *            properties:
 *              code:
 *                type: integer
 *              data:
 *                type: string
 *        '200':
 *          schema:
 *            type: object
 *            properties:
 *              date:
 *                type: Date
 *              commit:
 *                type: string
 *              version:
 *                type: string
 */
router.get('/version', asyncHandler(async (_, res) => {
  const ret = { code: 404, data: 'Can not found version file' };
  if (await exists(pathVersion)) {
    const version = await readFile(pathVersion, 'utf8');
    ret.data = JSON.parse(version);
    ret.code = 200;
  }
  res.status(ret.code).send(ret);
}));

// Screen mode
screen.routerInit(router);

// App
app.routerInit(router);

// Audio
audio.routerInit(router);

// Clipboard
clipboard.routerInit(router);

// Windows
window.routerInit(router);

// Process
process.routerInit(router);

// Desktop
desktop.routerInit(router);

// Broadcast
broadcast.routerInit(router);

// eslint-disable-next-line no-unused-vars
router.use((err, req, res, _) => {
  console.error(req.path);
  console.error(err.stack);
  res.status(500).send({ code: 500, data: 'Internal server error' });
});

module.exports = router;
