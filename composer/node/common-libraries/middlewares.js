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

const { validationResult } = require('express-validator');

const handleErrorMiddleWare = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const retErrors = { errors: errors.array() };
        console.error(`[BAD REQUEST PARAMS] \n\t -[PATH: ${req.path}] \n\t -[ERROR_TRACE: ${JSON.stringify(retErrors)}] \n\t -[AT: ${new Date().toUTCString()}]`);
        return res.status(422).json(retErrors);
    }
    next();
};


const capitalizeFirstLetter = string => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};


const numberValidor = (value, properties) => {
    if (typeof value !== "number") {
        throw new Error(`${capitalizeFirstLetter(properties.path)} must be a number`);
    }
    return true;
};

const numberStrNumberValidor = (value, properties) => {
    if (isNaN(value)) {
        throw new Error(`${capitalizeFirstLetter(properties.path)} must be a number`);
    }
    return true;
};

/**
 * @param {Array<Function>|Function} middlewares 
 * @returns {Array<Function>}
 */
const getFinalMiddlewares = middlewares => {
    return Array.isArray(middlewares) ? 
        [...middlewares, handleErrorMiddleWare] : 
        [middlewares, handleErrorMiddleWare];
}

module.exports = {
    getFinalMiddlewares,
    numberValidor,
    numberStrNumberValidor,
    capitalizeFirstLetter
};
