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

const { body, query } = require('express-validator');
const { getFinalMiddlewares } = require('../common-libraries/middlewares');

const middleWareFileQuery = query('file')
  .exists({ checkNull: true })
  .withMessage('No file provided')
  .bail()
  .isString()
  .withMessage('file must be a string')
  .bail()
  .notEmpty()
  .withMessage('file must not be empty')
  .bail();

const middleWareFileBody = body('file')
  .exists({ checkNull: true })
  .withMessage('No file provided')
  .bail()
  .isString()
  .withMessage('file must be a string')
  .bail()
  .notEmpty()
  .withMessage('file must not be empty')
  .bail();

const middleWareDirectoryQuery = query('directory')
  .exists({ checkNull: true })
  .withMessage('No directory provided')
  .bail()
  .isString()
  .withMessage('directory must be a string')
  .bail()
  .notEmpty()
  .withMessage('directory must not be empty')
  .bail();

function middlewareCheckFile(req, res, next) {
  if (req.file === undefined
    || typeof req.file !== 'object'
    || typeof req.file.originalname !== 'string'
    || !(req.file.buffer instanceof Buffer)) {
    const ret = { errors: [{ location: 'request', msg: 'No file provided' }] };
    res.status(422).send(ret);
    return;
  }
  next();
}

module.exports = {
  middleWareFileQuery: getFinalMiddlewares(middleWareFileQuery),
  middleWareFileBody: getFinalMiddlewares(middleWareFileBody),
  middleWareDirectoryQuery: getFinalMiddlewares(middleWareDirectoryQuery),
  middlewareCheckFile,
};
