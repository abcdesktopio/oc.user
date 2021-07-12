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

const helmet = require('helmet');
const express = require('express');
const npid = require('npid');

const router = require('./lib_spawner/router');
const { broadcastwindowslist } = require('./lib_spawner/broadcast');
const {
  listenDaemonOnContainerIpAddr,
} = require('oc.user.libraries');

const PORT = process.env.SPAWNER_SERVICE_TCP_PORT || 29786;
const app = express();

///
// write the pid to /var/run/desktop/spawner.pid
// this current process pid is used by the window manager
// to send signals SIG_USR1 and SIG_USR2
try {
  const pid = npid.create('/var/run/desktop/spawner.pid', true);
  pid.removeOnExit();
} catch (err) {
  // Fatal error failed to write pid in file /var/run/desktop/spawner.pid
  console.log(err);
  // exit now
  process.exit(1);
}

function handleSignal(signal = '') {
  return () => {
    console.log(
      `${signal} recieved (the windows manager send a window has been ${
        signal === 'SIGUSR1' ? 'created' : 'closed'
      })`,
    );
    broadcastwindowslist(signal).catch(console.error);
  };
}

process.on('SIGUSR1', handleSignal('SIGUSR1'));
process.on('SIGUSR2', handleSignal('SIGUSR2'));

app.use(helmet());

app.use('/spawner', router);

listenDaemonOnContainerIpAddr(
  app,
  PORT,
  `Spawner-service is listenning on port ${PORT}`,
);

console.log('spawner:initspawner master');
