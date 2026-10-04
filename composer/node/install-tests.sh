#!/bin/bash

source /etc/os-release 
echo "distrib $ID $VERSION"

if [[ ${ID} == "alpine" ]]; then
	echo "install packages for $ID"
	apk add git gcc make g++ bash build-base alpine-sdk sudo wget python3 libx11-dev 
	apk add xeyes net-tools
fi

if [[ ${ID} == "ubuntu" ]]; then
	echo "install packages for $ID"
	apt-get update
	echo "apt-get install -y curl libxmu-dev gcc g++ make libx11-dev libxmu-dev git libimlib2-dev libpng-dev"
	apt-get install -y curl libxmu-dev gcc g++ make libx11-dev libxmu-dev git libimlib2-dev libpng-dev
	apt-get install -y x11-apps net-tools
fi

# colorflow
#echo "install /composer/node/spawner-service/lib_spawner/colorflow"
#cd /composer/node/spawner-service/lib_spawner/colorflow
#npm i

echo "install /composer/node/spawner-service"
cd /composer/node/spawner-service
npm i

echo "install /composer/node/broadcast-service"
cd /composer/node/broadcast-service
npm i

if [ -d /composer/node/xterm.js ]; then
  echo "install /composer/node/xterm.js"
  cd /composer/node/xterm.js
  npm i
fi 

echo "full install npm done"

