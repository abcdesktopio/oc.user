# oc.user


This repository contains the source code to build a user desktop container for abcdesktop project.

![Build and test oc.user images](https://github.com/abcdesktopio/oc.user/workflows/Build%20and%20test%20oc.user%20images%20linux%20amd64/badge.svg)
![Docker Stars](https://img.shields.io/docker/stars/abcdesktopio/oc.user.svg) 
![Docker Pulls](https://img.shields.io/docker/pulls/abcdesktopio/oc.user.svg)
![GNU GPL v2.0 License](https://img.shields.io/github/license/abcdesktopio/oc.user.svg)

abcdesktop.io user container based on ubuntu

## Clone the repository

```bash
git clone https://github.com/abcdesktopio/oc.user.git
cd oc.user
git submodule update --init --recursive --remote
```

## Build the complete desktop container image

### Build command for docker mode

To build the oc.user image in docker mode, set the build arguemnt value `TARGET_MODE` to `docker`

```bash
docker build \
       --build-arg TARGET_MODE=ubuntu \
       --build-arg BASE_IMAGE_RELEASE=22.04 \
       --build-arg BASE_IMAGE=ubuntu \
       --tag oc.user.ubuntu:dev \
       --file ./Dockerfile.ubuntu .
```

## TARGET_MODE

TARGET_MODE is defined as
- ubuntu 
- hardening

hardening image is an ubuntu image but does not contain
- xterm.js service
- qterminal command
- sudo command


## Test command

Only docker image format is supported by the `make-test.sh` script.
To test the new image `oc.user.ubuntu:dev`, run the `make-test.sh` script :

```bash
./make-test.sh oc.user.ubuntu:dev
```

## To get more informations

Please, read the public documentation web site:
* [https://abcdesktopio.github.io/](https://abcdesktopio.github.io/)

