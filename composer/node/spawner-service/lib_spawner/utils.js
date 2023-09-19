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
const path = require('path');

/**
 *
 * @param {string} key
 * @param {string} path
 */
function safeNormalizePath( key, localDirectory )
{
  // default return code
  // location direcotry of .store file 
  const store_directory = path.join(process.env.HOME, localDirectory);
  // location directory of resquested file
  const requestedfile = path.join(store_directory,key);
  // normalize the requested file
  const normalize_requestedfile = path.normalize( requestedfile );
  var requested_directory = path.dirname(normalize_requestedfile);
  // if the reqested directory is not $HOME/.store
  // return false
  if (requested_directory.startsWith(store_directory))
        return normalize_requestedfile;
  else
        return undefined;
}


/**
 *
 * @param {string} key
 */
async function get(key) {
  const ret = { code: 404, data: 'Not found' };
  const normalize_requestedfile = safeNormalizePath( key, '.store');
  if (!normalize_requestedfile) {
        // this can be an error or an attack
        console.error( `normalize_requestedfile has failed, path not in ${process.env.HOME}/.store requested ${key}` );
        return ret;
  }

  try {
    await fs.promises.access(normalize_requestedfile, fs.constants.R_OK);
    ret.data = await fs.promises.readFile(normalize_requestedfile, 'utf8');
    ret.code = 200;
  } catch(e) {
    console.error(e);
  }

  return ret;
}

/**
 *
 * @param {string} key
 * @param {string} value
 */
async function set(key, value) {
  const normalize_requestedfile = safeNormalizePath( key, '.store');
  if (normalize_requestedfile) {
  	console.log(`set : ${normalize_requestedfile}`);
  	await fs.promises.writeFile(fullpath, value);
  }
  else
    console.error( `normalize_requestedfile has failed, path not in ${process.env.HOME}/.store requested ${key}` );
}

/**
 *
 * @param {number} time in second
 * @desc Provide a promise which will be resolve after a given time
 */
function delay(time = 1000) {
  return new Promise((resolve) => {
    setTimeout(() => { resolve(); }, time);
  });
}

module.exports = { get, set, delay };
