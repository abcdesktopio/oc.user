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

const express             = require("express");
const expressWs           = require('express-ws');
const helmet              = require('helmet');
const Terminal            = require('./terminal') ;
const { dicoMiddlewares } = require('./middlewares');
const {
  assertIp,
  listenDaemonOnContainerIpAddr 
} = require('../common-libraries/index.js');

process.on('uncaughtException', err => {
  console.error(err.stack);
});

const appBase    = express();
const wsInstance = expressWs(appBase);
const { app }    = wsInstance;

const PORT = parseInt(process.env.PORT) || 29781;

app.use(helmet());

app.use((req, res, next) => {
  res.type('application/json');
  console.log(req.path);
  next();
});

app.use(express.json());

app.post('/terminals', dicoMiddlewares.get('terminals'), (req, res) => {
  const cols = parseInt(req.query.cols);
  const rows = parseInt(req.query.rows);
  const term = new Terminal(cols, rows);
  res.send(term.pid.toString());
});

app.post('/terminals/:pid/size', dicoMiddlewares.get('terminals/:pid/size'), (req, res) => {
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

  res.status(ret.code).send(ret);
});

app.ws('/terminals/:pid', async (ws, req) => {
  const { remoteAddress:socketIp } = ws._socket;
  const { remoteAddress:requestIp } = req.connection;
  const pid = parseInt(req.params.pid);
  const term = Terminal.terminals.get(pid);

  console.log("Connection with client socketIp :" + socketIp);
  console.log("Connection with client requestIp :" + requestIp);
  try {
    if (process.env.TESTING_MODE !== 'true') {
      await assertIp(socketIp);
      await assertIp(requestIp.replace('::ffff:', ''));
    }
  } catch (e) {
    console.error(e);
    ws.close();
    return;
  }

  console.log('Connected to terminal ' + term.pid);
  term.regiterSocket(ws);
});

app.use((err, req, res, _) => {
  console.error(req.path);
  console.error(err.stack);
  res.status(500).send({ code:500, data:'Internal server error' });
});

listenDaemonOnContainerIpAddr(app, PORT, `Abcdesktop xterm is up on port: ${PORT}`);
