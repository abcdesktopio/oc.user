#!/bin/bash

# The default install use yarn install
# yarn install --production=true
# this script install missing package with --production=false option
# yarn install --production=false

apt-get update
apt-get install -y 	\
	libxmu-dev	\
	gcc             \
	g++             \
	make    	\
	libx11-dev 	\
	libxmu-dev 	\
	git

