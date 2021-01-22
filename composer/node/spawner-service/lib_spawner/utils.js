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

/**
 *
 * @param {string} key
 */
async function get(key) {
  const fullpath = `${process.env.HOME}/.store/${key}`;
  console.log(`get : ${fullpath}`);

  const ret = { code: 404, data: 'Not found' };
  try {
    await fs.promises.access(fullpath, fs.constants.R_OK);
    ret.data = await fs.promises.readFile(fullpath, 'utf8');
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
  const fullpath = `${process.env.HOME}/.store/${key}`;
  console.log(`set : ${fullpath}`);
  await fs.promises.writeFile(fullpath, value);
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
