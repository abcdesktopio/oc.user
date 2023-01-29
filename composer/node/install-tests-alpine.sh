#!/bin/bash

# The default install use yarn install
# yarn install --production=true
# this script install missing package with --production=false option
# yarn install --production=false

apk add git gcc make g++ bash build-base alpine-sdk sudo wget python3 libx11-dev yarn

