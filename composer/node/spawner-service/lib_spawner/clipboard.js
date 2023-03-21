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

const { spawn } = require('child_process');

/**
 * -selection
    specify which X selection to use,
    options are "primary" to use XA_PRIMARY (default),
    "secondary" for XA_SECONDARY or "clipboard" for XA_CLIPBOARD
 * @desc Sync both clipboards
 */
function clipboardsync() {
  // Print selected data from primary clipboard to standard output
  const xclip = spawn('/usr/bin/xclip', ['-selection', 'primary', '-o'], {
    env: process.env,
  });

  xclip.stdout.on('data', (data) => {
    const xoutclip = spawn('/usr/bin/xclip', ['-selection', 'clipboard', '-i'], {
      env: process.env,
    });

    // Write output from primary to clipboard
    xoutclip.stdin.write(data);
    xoutclip.stdin.end();
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
   * /clipboardsync:
   *  post:
   *    description: Synchronize X11 and gtk clipboard
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
  router.post('/clipboardsync', (_, res) => {
    // Sync primary clipboard to gtk default clipboard
    clipboardsync();
    res.status(200).send({ code: 200, data: 'ok' });
  });
}

module.exports = { routerInit };
