#!/bin/bash

# The default install use yarn install
# yarn install --production=true
# this script install missing package with --production=false option
# yarn install --production=false

distrib=$(awk '/^ID=/' /etc/*-release | sed 's/ID=//' | tr '[:upper:]' '[:lower:]')
echo "distrib is $distrib"

if [[ ${distrib} == "alpine" ]]; then
	echo "install packages for $distrib"
	apk add git gcc make g++ bash build-base alpine-sdk sudo wget python3 libx11-dev yarn
fi

if [[ ${distrib} == "ubuntu" ]]; then
	echo "install packages for $distrib"
	apt-get update
	apt-get install -y libxmu-dev gcc g++ make libx11-dev libxmu-dev git
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
