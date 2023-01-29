#!/bin/bash

# The default install use yarn install
# yarn install --production=true
# this script install missing package with --production=false option
# yarn install --production=false

DISTRIB=$(awk '/^ID=/' /etc/*-release | sed 's/ID=//' | tr '[:upper:]' '[:lower:]')
echo "distrib is $DISTRIB"
if [ -f /composer/node/install-tests-$DISTRIB.sh ]; then
	echo "call /composer/node/install-tests-$DISTRIB.sh"
	/composer/node/install-tests-$DISTRIB.sh
fi	

# install yarn with npm install
# npm install -g yarn
# install full options without production
echo "install /composer/node/spawner-service"
cd /composer/node/spawner-service
yarn install --production=false

echo "install /composer/node/file-service"
cd /composer/node/file-service
yarn install --production=false

echo "install /composer/node/broadcast-service"
cd /composer/node/broadcast-service
yarn install --production=false

echo "install /composer/node/xterm.js"
cd /composer/node/xterm.js
yarn install --production=false

echo "full install yarn done"
