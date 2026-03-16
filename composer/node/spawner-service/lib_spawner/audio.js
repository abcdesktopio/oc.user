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

const childProcess = require('child_process');
const asyncHandler = require('express-async-handler');
const middlewares = require('./middlewares');
const globalValues = require('../global-values');
const util = require('util');
const exec = util.promisify(childProcess.exec);

const pathSocketPulse = globalValues.pathSocketPulse;
const pathPulseCtl = '/usr/bin/pactl';


/**
 *
 * @param {Function} callback
 * @desc Run pactl info
 * run pactl -s /tmp/.pulse.sock info
 */
async function isPulseAvailable(callback) {
  const pactlCommandInfo = `${pathPulseCtl} -s ${pathSocketPulse} info`;
  childProcess.exec(pactlCommandInfo, (err, stdout, stderr) => {
    if ( err )
      console.error( pactlCommandInfo, ' returns ', stderr);
  }).on('exit', (code) => {
        if (code === 0)
          callback( { status:200, message:'OK'} );
        else
          callback( { status:500, message:'error'} );
  });
}


function routerInit(router) {

  router.get('/isPulseAvailable', asyncHandler(async (req, res) => {
    isPulseAvailable( (data) => {
      res.send(data);
    });
  }));

}


module.exports = { routerInit };
