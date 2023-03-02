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

const pty =  require('node-pty');

module.exports = class Terminal {
    get pid() {
        return this._termProcess.pid;
    }

    static terminals = new Map();
    buffer = '';
    constructor(cols, rows) {
        const forkOptions = {
          name: 'xterm-256color',
          cols: cols || 80,
          rows: rows || 24,
          cwd: process.env.HOME,
          env: {
            COLORTERM:'truecolor',
            ...process.env
          },
          encoding: 'utf8'
        };

        this._termProcess = pty.spawn(process.platform === 'win32' ? 'cmd.exe' : 'bash', [], forkOptions);
        this._termProcess.on("data", data => { 
            this._logs += data;
            if (process.env.VERBOSE === "true") {
                process.stdout.write(data);
            }
            this.emitDataToSocket(data);
        });
        console.log('Created terminal with PID: ' + this._termProcess.pid);
        Terminal.terminals.set(this.pid, this);
    }

    emitDataToSocket(data) {
        if (this._socket) {
            this._socket.send(this.buffer + data);
            this.buffer = '';
        }
        else {
            this.buffer += data;
        }
    }

    regiterSocket(socket) {
        this._socket = socket;
        this._socket.on('message', (msg) => {
            this._termProcess.write(msg);
        });

        this._socket.on('close', () => {
            this._termProcess.kill();
            Terminal.terminals.delete(this.pid);
            console.log('Closed terminal ' + this.pid);
        });
        this.addEventCloseTerminal();
        this.emitDataToSocket("");
    }

    addEventCloseTerminal() {
        this._termProcess.on("exit", () => {
            this._socket.close();
        });
    }

    resize(columns, rows) {
        this._termProcess.resize(columns, rows);
    }
}
