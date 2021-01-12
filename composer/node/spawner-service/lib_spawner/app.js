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

const asyncHandler = require('express-async-handler');
const { callbackExec, setCultureInfo } = require('./process');
const dicoMiddlewares = require('./middlewares');
const { applist, language } = require('../global-values');

/**
 *
 * @param {String} command
 * @param {Array<String>} args
 * @desc // xdg-mime query default application/pdf
 */
function launch(command, args) {
  if (!command) { // Check the command their
    const ret = { code: 500, data: 'invalid command' };
    return ret;
  }

  console.log(`launch:language is: ${language}`);
  // check if command exist as an applist entry
  for (const app of applist) {
    if (command === app.key) {
      const resolvedPath = app.path;
      const newargs = [];

      // if applist define some default args
      if (app.args) {
        // if args is an array
        // put each item
        if (Array.isArray(app.args)) {
          newargs.push(...app.args);
        } else {
          // only one param concat it
          newargs.push(app.args);
        }
      }

      if (args) {
        if (args instanceof Array) {
          newargs.push(...args);
        } else {
          newargs.push(args);
        }
      }

      return callbackExec(null, resolvedPath, newargs);
    }
  }

  return { code: 404, data: 'Not found' };
}

function routerInit(router) {
  /**
   * @swagger
   *
   * definitions:
   *  launch:
   *      properties:
   *          code:
   *              type: integer
   *          data:
   *              type: object
   *
   * /launch:
   *      post:
   *        description: Used to run builtin application process
   *        produces:
   *          - application/json
   *        requestBody:
   *          content:
   *            application/json:
   *              schema:
   *                type: object
   *                required:
   *                - command
   *                properties:
   *                  command:
   *                    type: string
   *                  args:
   *                    type: array
   *                    items:
   *                      type: string
   *        responses:
   *          '500':
   *            schema:
   *              $ref: '#/definitions/InternalError'
   *          '200':
   *            schema:
   *              $ref: '#/definitions/launch'
   */
  router.post('/launch', dicoMiddlewares.get('launch'), asyncHandler(async (req, res) => {
    const { command = '', args = [] } = req.body;
    setCultureInfo(req.headers['accept-language']);
    console.log(`router.post:language is: ${language}`);
    const ret = await launch(command, args);
    res.status(ret.code).send(ret);
  }));
}

module.exports = { routerInit };
