#!/bin/bash

# set vars for test mode
export DISPLAY=:0.0
CONTAINER_IP=$(hostname -i)
echo "TARGET_MODE=$TARGET_MODE"
echo "netstat dump"
netstat -anp 

echo 'testing spawner-service'
cd /composer/node/spawner-service 
CONTAINER_IP=${CONTAINER_IP} yarn test

echo 'testing broadcast-service'
cd /composer/node/broadcast-service 
CONTAINER_IP=${CONTAINER_IP} yarn test

# xterm exists only in 'ubuntu' ( the default configuration )
if [ "$TARGET_MODE" == "ubuntu" ]; then
	cd /composer/node/xterm.js 
	CONTAINER_IP=${CONTAINER_IP} yarn test
fi
