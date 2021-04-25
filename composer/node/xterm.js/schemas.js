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
  postTerminalsOpts: {
    schema: {
      query: {
        type: 'object',
        properties: {
          cols: {
            type: 'number',
          },
          rows: {
            type: 'number',
          },
        },
        required: ['cols', 'rows'],
      }
    }
  },
  postTerminalsSizeByPid: {
    schema: {
      query: {
        type: 'object',
        properties: {
          cols: {
            type: 'number',
          },
          rows: {
            type: 'number',
          },
        },
        required: ['cols', 'rows'],
      },
      params: {
        type: 'object',
        properties: {
          pid: {
            type: 'number',
          },
        },
        required: ['pid'],
      }
    }
  },
  getTerminalsByPidOpts: {
    websocket: true,
    schema: {
      params: {
        type: 'object',
        properties: {
          pid: { type: 'number' },
        },
        required: ['pid'],
      }
    }
  },
};
