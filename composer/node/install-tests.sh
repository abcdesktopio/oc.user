#!/bin/bash
# yarn install set --production=true
# this script install missing package without --production=true option
curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor | sudo tee /usr/share/keyrings/yarnkey.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/yarnkey.gpg] https://dl.yarnpkg.com/debian stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
apt-get update && apt-get install yarn
# apt-get install -y npm
apt-get install -y 	\
	libxmu-dev	\
	gcc             \
	g++             \
	make    	\
	libx11-dev 	\
	libxmu-dev 	\
	git
# install yarn with npm install
# npm install -g yarn
# install full options without production
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
