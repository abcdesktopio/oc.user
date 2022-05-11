#!/bin/bash
# yarn install set --production=true
# this script install missing package without --production=true option
npm install -g yarn
apt-get update && apt-get install -y 	\
	libxmu-dev			\
	gcc                             \
	g++                             \
	make    			\
	libx11-dev 			\
	libxmu-dev 			\
	git

echo "install /composer/node/spawner-service"
cd /composer/node/spawner-service
yarn install

echo "install /composer/node/file-service"
cd /composer/node/file-service
yarn install

echo "install /composer/node/broadcast-service"
cd /composer/node/broadcast-service
yarn install

echo "install /composer/node/xterm.js"
cd /composer/node/xterm.js
yarn install

echo "full install yarn done"
