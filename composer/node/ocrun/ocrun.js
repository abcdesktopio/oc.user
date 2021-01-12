#!/usr/bin/node

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
var method = 'ocrun';

var fs = require('fs');
var util = require('util');
const path = require('path');
const os = require('os');

function logme( data )
{
    console.log( data );	
    fs.appendFileSync("/var/log/desktop/ocrun.log", util.inspect(data));
}


const networkInterfaces = os.networkInterfaces();
let firstNotLoIface = '';

// This should always return eth0
function getEth0OrFirstNotLoIface(){
        if('eth0' in networkInterfaces) return 'eth0';

        Object.keys(networkInterfaces).forEach(i => {
                if( i !== 'lo'){
                        console.log(i);
                        return i;
                }
        });
}

function broadcastevent(data) {

    try {
    	var WebSocketClient = require('ws');
	var broadcast_tcp_port = process.env.BROADCAST_SERVICE_TCP_PORT || 29784;
	var target = process.env.CONTAINER_IP_ADDR || networkInterfaces[firstNotLoIface][0].address;
        var buri = "ws://" + target + ":" + broadcast_tcp_port;
    	var ws = new WebSocketClient(buri);

    	ws.on('open', function open() {
        	try {
            		ws.send(JSON.stringify(data));
            		ws.close();
        	} catch (err) {
            		logme(err);
        	}
    	});
    }
    catch (err) {
            logme(err);
    }
}


if (process.argv.length < 2) {
	console.log('invalid params exit(1) ');
	process.exit(1);	
}

var image = path.basename(process.argv[1]);
var args;

for (var i=2; i<process.argv.length; ++i) {
	if (args)
		args += ' ';
	else
	    args = '';
	args += process.argv[i];
}

var pod_name = process.env.POD_NAME;
var pod_namespace = process.env.POD_NAMESPACE;
firstNotLoIface=getEth0OrFirstNotLoIface();

var data = { method: method, data:{ 'image': image, 'args':args, 'pod_name': pod_name, 'pod_namespace': pod_namespace }};
logme( data );
broadcastevent( data );

