#!/bin/bash

# The default install use yarn install
# yarn install --production=true
# this script install missing package with --production=false option
# yarn install --production=false

distrib=$(awk '/^ID=/' /etc/*-release | sed 's/ID=//' | tr '[:upper:]' '[:lower:]')
echo "distrib is $distrib"

for f in passwd shadow group gshadow ; do rm -f /etc/$f && cp $ABCDESKTOP_LOCALACCOUNT_DIR/$f /etc/$f; done

if [[ ${distrib} == "alpine" ]]; then
	echo "install packages for $distrib"
	apk add git gcc make g++ bash build-base alpine-sdk sudo wget python3 libx11-dev yarn
	apk add xeyes
fi

if [[ ${distrib} == "ubuntu" ]]; then
	echo "install packages for $distrib"
	apt-get update
	apt-get install -y curl libxmu-dev gcc g++ make libx11-dev libxmu-dev git
	curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor | tee /usr/share/keyrings/yarnkey.gpg >/dev/nul
	echo "deb [signed-by=/usr/share/keyrings/yarnkey.gpg] https://dl.yarnpkg.com/debian stable main" | tee /etc/apt/sources.list.d/yarn.list
	apt-get update && apt-get install -y yarn
	apt-get install -y x11-apps
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
