#/bin/bash

export DISPLAY=:0.0

echo "test if yarn is installed"
YARN_VERSION=$(yarn --version)
YARN_COMMAND=$?
if [ $YARN_COMMAND -eq 0 ]; then
  echo "command yarn --version success $YARN_VERSION"
else
  echo "command yarn failed $YARN_COMMAND"
	echo "install yarn using npm"
	cd 
	npm install yarn
	export PATH=$PATH:/home/balloon/node_modules/yarn/bin/yarn
fi

CONTAINER_IP=$(hostname -I | awk '{print $1}')

cd /composer/node/spawner-service 
CONTAINER_IP=${CONTAINER_IP} yarn test

cd /composer/node/file-service 
CONTAINER_IP=${CONTAINER_IP} yarn test

cd /composer/node/broadcast-service 
CONTAINER_IP=${CONTAINER_IP} yarn test

cd /composer/node/xterm.js 
CONTAINER_IP=${CONTAINER_IP} yarn test
