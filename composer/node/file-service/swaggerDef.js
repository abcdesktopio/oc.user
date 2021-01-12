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

module.exports = {
  info: {
    title: 'File service',
    version: '1.0.0',
    description: 'API used for managing files on user container',
  },
  basePath: '/filer',
  apis: [
    './file-service.js',
  ],
};
