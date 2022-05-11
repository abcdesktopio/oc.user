#!/bin/bash

# set vars for test mode
export DISPLAY=:0.0
CONTAINER_IP=$(hostname -I | awk '{print $1}')

cd /composer/node/spawner-service 
CONTAINER_IP=${CONTAINER_IP} yarn test

cd /composer/node/file-service 
CONTAINER_IP=${CONTAINER_IP} yarn test

cd /composer/node/broadcast-service 
CONTAINER_IP=${CONTAINER_IP} yarn test

cd /composer/node/xterm.js 
CONTAINER_IP=${CONTAINER_IP} yarn test
