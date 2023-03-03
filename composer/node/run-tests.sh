#!/bin/bash

# set vars for test mode
export DISPLAY=:0.0
CONTAINER_IP=$(hostname -i)


echo 'netstat dump'
netstat -anp 

echo 'testing spawner-service'
cd /composer/node/spawner-service 
CONTAINER_IP=${CONTAINER_IP} yarn test

# cd /composer/node/file-service 
# CONTAINER_IP=${CONTAINER_IP} yarn test

echo 'testing broadcast-service'
cd /composer/node/broadcast-service 
CONTAINER_IP=${CONTAINER_IP} yarn test

if [ -f /TARGET_MODE ]; then
	if [ $(cat /TARGET_MODE) != hardening ]; then
		cd /composer/node/xterm.js 
		CONTAINER_IP=${CONTAINER_IP} yarn test
	fi
fi
