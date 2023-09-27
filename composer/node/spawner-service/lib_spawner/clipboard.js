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
 read https://superuser.com/questions/90257/what-is-the-difference-between-the-x-clipboards
 * -selection
    specify which X selection to use,
    options are "primary" to use XA_PRIMARY (default),
    "secondary" for XA_SECONDARY or "clipboard" for XA_CLIPBOARD
 * @desc Sync both clipboards
 */
function clipboardsync() {
  // Read selected data from primary clipboard to standard output
  // Read the XA_PRIMARY clipboard
  const xclip = spawn('/usr/bin/xclip', ['-selection', 'primary', '-o'], {
    env: process.env,
  });

  // write XA_PRIMARY clipboard data to XA_SECONDARY and to XA_CLIPBOARD
  // 
  xclip.stdout.on('data', (data) => {
      
    const xoutclip_xa_clipboard = spawn(
        '/usr/bin/xclip', 
        ['-selection', 'clipboard', '-i'], 
        { env: process.env }
    );
    // Write output from primary to clipboard
    xoutclip_xa_clipboard.stdin.write(data);
    xoutclip_xa_clipboard.stdin.end();

    const xoutclip_xa_secondary = spawn(
        '/usr/bin/xclip', 
        ['-selection', 'secondary', '-i'], 
        { env: process.env }
    );
    // Write output from primary to secondary
    xoutclip_xa_secondary.stdin.write(data);
    xoutclip_xa_secondary.stdin.end();
      
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
