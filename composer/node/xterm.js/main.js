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

const fastify = require('fastify')({ logger: true });
fastify.register(require('fastify-websocket'));

const Terminal = require('./terminal') ;
const {
  assertIp,
  listenDaemonOnContainerIpAddrUsingFastify,
} = require('../common-libraries/index.js');

const {
  getTerminalsByPidOpts,
  postTerminalsOpts,
  postTerminalsSizeByPid,
} = require('./schemas');

const PORT = parseInt(process.env.PORT) || 29781;

fastify.post('/terminals', postTerminalsOpts, (req, reply) => {
  const cols = parseInt(req.query.cols);
  const rows = parseInt(req.query.rows);
  const term = new Terminal(cols, rows);
  const terminalPid = term.pid.toString();
  console.log(`Terminal created with pid: ${terminalPid}`);
  reply
    .code(200)
    .type('application/json; charset=utf-8')
    .send(terminalPid);
});

fastify.post('/terminals/:pid/size', postTerminalsSizeByPid, (req, reply) => {
  const pid  = parseInt(req.params.pid);
  const cols = parseInt(req.query.cols);
  const rows = parseInt(req.query.rows);
  const term = Terminal.terminals.get(pid);
  const ret  = { code:404, data:'Pid not found' };

  if (term) {
    term.resize(cols, rows);
    console.log(`Resized terminal ${pid} to ${cols}  cols and ${rows} rows.`);
    ret.code = 200;
    ret.data = 'ok';
  }

  reply
    .code(ret.code)
    .type('application/json; charset=utf-8')
    .send(ret);
});

fastify.get('/terminals/:pid', getTerminalsByPidOpts, async (connection, req) => {
  const { remoteAddress:requestIp } = req.socket;
  const pid = parseInt(req.params.pid);
  const term = Terminal.terminals.get(pid);

  console.log("Connection with client requestIp :" + requestIp);
  try {
    if (process.env.TESTING_MODE !== 'true') {
      await assertIp(requestIp.replace('::ffff:', ''));
    }
  } catch (e) {
    console.error(e);
    connection.socket.close();
    return;
  }

  console.log('Connected to terminal ' + term.pid);
  term.regiterSocket(connection.socket);
});

listenDaemonOnContainerIpAddrUsingFastify(fastify, PORT, `Abcdesktop.io's xterm is up on port: ${PORT}`);

process.on('uncaughtException', err => {
  console.error(err.stack);
});
