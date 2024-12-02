#!/bin/bash

# The default install use yarn install
# yarn install --production=true
# this script install missing package with --production=false option
# yarn install --production=false

source /etc/os-release 
echo "distrib $ID $VERSION"

for f in passwd shadow group gshadow ; do rm -f /etc/$f && cp $ABCDESKTOP_LOCALACCOUNT_DIR/$f /etc/$f; done

if [[ ${ID} == "alpine" ]]; then
	echo "install packages for $ID"
	apk add git gcc make g++ bash build-base alpine-sdk sudo wget python3 libx11-dev yarn
	apk add xeyes net-tools
fi

if [[ ${ID} == "ubuntu" ]]; then
	echo "install packages for $ID"
	apt-get update
	echo "apt-get install -y curl libxmu-dev gcc g++ make libx11-dev libxmu-dev git libimlib2-dev libpng-dev"
	apt-get install -y curl libxmu-dev gcc g++ make libx11-dev libxmu-dev git libimlib2-dev libpng-dev
	apt-get install -y x11-apps net-tools
fi

# install yarn with npm install
echo "install yarn using npm"
npm install -g yarn
# install full options without production

echo "install /composer/node/spawner-service/lib_spawner/colorflow"
cd /composer/node/spawner-service/lib_spawner/colorflow
yarn install  --production=false

echo "install /composer/node/spawner-service"
cd /composer/node/spawner-service
yarn install --production=false

echo "install /composer/node/broadcast-service"
cd /composer/node/broadcast-service
yarn install --production=false

if [ -d /composer/node/xterm.js ]; then
  echo "install /composer/node/xterm.js"
  cd /composer/node/xterm.js
  yarn install --production=false
fi 

echo "full install yarn done"

