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
const { promisify } = require('util');

const exists = promisify(fs.exists);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

/**
 *
 * @param {string} key
 */
async function get(key) {
  const fullpath = `${process.env.HOME}/.store/${key}`;
  console.log(`get : ${fullpath}`);

  const ret = { code: 404, data: 'Not found' };
  if (await exists(fullpath)) {
    ret.data = await readFile(fullpath, 'utf8');
    ret.code = 200;
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
  await writeFile(fullpath, value);
}

/**
 *
 * @param {*} time in second
 * @desc Provide a promise which will be resolve after a given time
 */
function delay(time = 1) {
  return new Promise((resolve) => {
    setTimeout(() => { resolve(); }, time * 1000);
  });
}

module.exports = { get, set, delay };
