#!/bin/bash

# set vars for test mode
export DISPLAY=:0.0
export CONTAINER_IP=$(hostname -i)
echo "CONTAINER_IP=$CONTAINER_IP"
echo "TARGET_MODE=$TARGET_MODE"
echo "netstat dump"
netstat -anp 

echo 'testing spawner-service'
cd /composer/node/spawner-service
npm test

echo 'testing broadcast-service'
cd /composer/node/broadcast-service 
npm test

# if xterm exists only 
if [ -d /composer/node/xterm.js ]; then
	echo 'testing xterm-service'
	cd /composer/node/xterm.js 
	npm test
fi
