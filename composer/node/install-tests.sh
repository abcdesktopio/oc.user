#!/bin/bash

# The default install use yarn install
# yarn install --production=true
# this script install missing package with --production=false option
# yarn install --production=false

source /etc/os-release 
echo "distrib $ID $VERSION"

if [[ ${ID} == "alpine" ]]; then
	echo "install packages for $ID"
	apk add git gcc make g++ bash build-base alpine-sdk sudo wget python3 libx11-dev nodejs 
	apk add xeyes net-tools
fi

if [[ ${ID} == "ubuntu" ]]; then
	echo "install packages for $ID"
	apt-get update
	echo "apt-get install -y curl libxmu-dev gcc g++ make libx11-dev libxmu-dev git libimlib2-dev libpng-dev"
	apt-get install -y curl libxmu-dev gcc g++ make libx11-dev libxmu-dev git libimlib2-dev libpng-dev
	apt-get install -y x11-apps net-tools
	# install npm nodejs
        curl -fsSL https://deb.nodesource.com/setup_$NODE_MAJOR.x | bash - 
        apt-get update && apt-get install -y nodejs npm
        npm install -g npm
fi


echo "install /composer/node/spawner-service/lib_spawner/colorflow"
cd /composer/node/spawner-service/lib_spawner/colorflow
npm install
# do not test color flow
# already done 
rm -rf /composer/node/spawner-service/lib_spawner/colorflow/test /composer/node/spawner-service/lib_spawner/colorflow/colorflow.test.js

echo "install /composer/node/spawner-service"
cd /composer/node/spawner-service
npm install

echo "install /composer/node/broadcast-service"
cd /composer/node/broadcast-service
npm install

if [ -d /composer/node/xterm.js ]; then
  echo "install /composer/node/xterm.js"
  cd /composer/node/xterm.js
  npm install
fi 

echo "full install done"

