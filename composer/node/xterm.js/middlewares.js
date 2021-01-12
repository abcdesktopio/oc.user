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

const { query, param }        = require('express-validator');
const { 
    getFinalMiddlewares,
    numberStrNumberValidor,
} = require('../common-libraries/middlewares');

const checkQuery = (req, res, next) => {
    if (!req.query || typeof req.query !== "object") {
        console.error(`[BAD REQUEST QUERY] \n\t -[PATH: ${req.path}] Request must have a query \n\t -[AT: ${new Date().toUTCString()}]`);
        return res.status(422)
            .send();
    }
    next();
};

const checkParam = (req, res, next) => {
    if (!req.params|| typeof req.params!== "object") {
        console.error(`[BAD REQUEST PARAM] \n\t -[PATH: ${req.path}] Request must have params \n\t -[AT: ${new Date().toUTCString()}]`);
        return res.status(422)
            .send();
    }
    next();
};

/* SUMMARY
* exist -> Check if the field is presents in the body [checkNull:true] consider values as null doesn't exists
* bail -> Stop validation if any of previous validation failed
* isIn -> check if the value is in an array
*/

const middlewarePid = param("pid")
    .exists({checkNull:true})
    .withMessage("No pid provided")
    .bail()
    .isInt()
    .withMessage("Pid must be a number")
    .bail();

const middlewareCols = query("cols")
    .exists({checkNull:true})
    .withMessage("No cols provided")
    .bail()
    .custom(numberStrNumberValidor)
    .withMessage("Cols must be a number")
    .bail();

const middlewareRows = query("rows")
    .exists({checkNull:true})
    .withMessage("No rows provided")
    .bail()
    .custom(numberStrNumberValidor)
    .withMessage("Rows must be a number")
    .bail();

const dicoMiddlewares = new Map();

dicoMiddlewares.set("terminals", getFinalMiddlewares([checkQuery, middlewareCols, middlewareRows,]));
dicoMiddlewares.set("terminals/:pid/size", getFinalMiddlewares([checkParam, checkQuery, middlewareCols, middlewareRows, middlewarePid]));
dicoMiddlewares.set("terminals/:pid", getFinalMiddlewares([checkParam, middlewarePid,]));

exports.dicoMiddlewares = dicoMiddlewares;
