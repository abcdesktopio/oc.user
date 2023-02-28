# oc.user


This repository contains the source code to build a user desktop container for abcdesktop project.

![Build and test oc.user images](https://github.com/abcdesktopio/oc.user.18.04/workflows/Build%20and%20test%20oc.user%20images%20linux%20amd64/badge.svg)
![Docker Stars](https://img.shields.io/docker/stars/abcdesktopio/oc.user.18.04.svg) 
![Docker Pulls](https://img.shields.io/docker/pulls/abcdesktopio/oc.user.18.04.svg)
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
# docker build
echo kubernetes > TARGET_MODE
# docker build
docker build \
       --no-cache=$(NOCACHE) \
       --build-arg BASE_IMAGE_RELEASE=22.04 \
       --build-arg BASE_IMAGE=ubuntu \
       --tag abcdesktopio/oc.user.ubuntu:$(TAG) \
       --file ./Dockerfile.ubuntu .
```


## Test command

Only docker image format is supported by the `make-test.sh` script.
To test the new image `abcdesktopio/oc.user.18.04:dev`, run the `make-test.sh` script :

```bash
./make-test.sh abcdesktopio/oc.user.ubuntu:dev
```


## Makefile

The default image base is ubuntu. 


### Build image based on ubuntu


```bash
make ubuntu
Sending build context to Docker daemon  32.58MB
Step 1/70 : ARG TARGETPLATFORM
Step 2/70 : ARG BUILDPLATFORM
Step 3/70 : ARG TAG=latest
Step 4/70 : ARG BASE_IMAGE=ubuntu
Step 5/70 : FROM ${BASE_IMAGE}:${TAG} as openbox_ubuntu_builder
 ---> 6b7dfa7e8fdb
Step 6/70 : RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections
 ---> Using cache
 ---> 7a186e01f626
Step 7/70 : RUN sed -i '/deb-src/s/^# //' /etc/apt/sources.list
 ---> Using cache
 ---> e9b66b985137
Step 8/70 : RUN apt update
 ---> Using cache
 ---> 6e678692f215
Step 9/70 : RUN apt-get install -y --no-install-recommends fakeroot devscripts devscripts binutils wget
 ---> Using cache
 ---> e265cfa5cf22
Step 10/70 : RUN apt-get build-dep -y openbox
 ---> Using cache
 ---> 25c961b68bb7
Step 11/70 : RUN mkdir -p /openbox/src
 ---> Using cache
 ---> 34443452c626
Step 12/70 : WORKDIR /openbox
 ---> Using cache
 ---> f30824964c0a
Step 13/70 : RUN apt-get source openbox
 ---> Using cache
 ---> 9f7f6b4d180d
Step 14/70 : RUN wget https://raw.githubusercontent.com/abcdesktopio/openbox/main/openbox.title.patch
 ---> Using cache
 ---> 4b20117b4a9f
Step 15/70 : RUN cd openbox-3.6.1 && patch -p2 < ../openbox.title.patch
 ---> Using cache
 ---> 239a854c4f40
Step 16/70 : RUN cd openbox-3.6.1 && dch -n abcdesktop_sig_usr
 ---> Using cache
 ---> 7402cca44a7b
Step 17/70 : RUN cd openbox-3.6.1 && EDITOR=/bin/true dpkg-source -q --commit . abcdesktop_sig_usr
 ---> Using cache
 ---> 799a04c61e56
Step 18/70 : RUN cd openbox-3.6.1 && debuild -us -uc
 ---> Using cache
 ---> ce1a843631a6
Step 19/70 : FROM ${BASE_IMAGE}:${TAG} as ubuntu_node_modules_builder
 ---> 6b7dfa7e8fdb
Step 20/70 : COPY TARGET_MODE /TARGET_MODE
 ---> Using cache
 ---> 6b841223bf21
Step 21/70 : RUN apt-get update && apt-get install -y  --no-install-recommends              gcc                                     g++                                     make                                    && apt-get clean                        && rm -rf /var/lib/apt/lists/*
 ---> Using cache
 ---> f7c0003e917e
Step 22/70 : RUN apt-get update && apt-get install -y  --no-install-recommends         ca-certificates         libx11-dev         libxmu-dev         git                curl               gnupg              dpkg
 ---> Using cache
 ---> c4706930b94e
Step 23/70 : RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -     && apt-get install -y nodejs && apt-get clean && rm -rf /var/lib/apt/lists/* && node --version
 ---> Using cache
 ---> 998ccd65e95b
Step 24/70 : RUN curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor | tee /usr/share/keyrings/yarnkey.gpg >/dev/null
 ---> Using cache
 ---> be8eaf1abe28
Step 25/70 : RUN echo "deb [signed-by=/usr/share/keyrings/yarnkey.gpg] https://dl.yarnpkg.com/debian stable main" | tee /etc/apt/sources.list.d/yarn.list
 ---> Using cache
 ---> 0c2c6989a7dd
Step 26/70 : RUN apt-get update && apt-get install -y yarn
 ---> Using cache
 ---> df7eaab99f57
Step 27/70 : COPY composer /composer
 ---> Using cache
 ---> 0e30c151c764
Step 28/70 : WORKDIR /composer/node/wait-port
 ---> Using cache
 ---> ede3d7dab6fc
Step 29/70 : RUN yarn install --production=true
 ---> Using cache
 ---> 2299937762ba
Step 30/70 : WORKDIR /composer/node/common-libraries
 ---> Using cache
 ---> d82393f36802
Step 31/70 : RUN   yarn install --production=true
 ---> Using cache
 ---> e8e76607c29f
Step 32/70 : WORKDIR /composer/node/broadcast-service
 ---> Using cache
 ---> 66ddc9030a48
Step 33/70 : RUN yarn install --production=true
 ---> Using cache
 ---> 22b621e972a3
Step 34/70 : WORKDIR /composer/node/ocrun
 ---> Using cache
 ---> 135fa1b48aa8
Step 35/70 : RUN yarn install --production=true
 ---> Using cache
 ---> c8945b44777a
Step 36/70 : WORKDIR /composer/node/ocdownload
 ---> Using cache
 ---> 61a643c48733
Step 37/70 : RUN yarn install --production=true
 ---> Using cache
 ---> 95bb09c5c876
Step 38/70 : WORKDIR /composer/node/occall
 ---> Using cache
 ---> 81aef12c3f1d
Step 39/70 : RUN yarn install --production=true
 ---> Using cache
 ---> 370bccd97dd4
Step 40/70 : WORKDIR /composer/node/spawner-service
 ---> Using cache
 ---> 25eba623deaf
Step 41/70 : RUN yarn global add node-gyp
 ---> Using cache
 ---> cc56d766202c
Step 42/70 : RUN yarn install --production=true
 ---> Using cache
 ---> e37196c45816
Step 43/70 : WORKDIR /composer/node/xterm.js
 ---> Using cache
 ---> db0ab5683346
Step 44/70 : RUN if [ $(cat /TARGET_MODE) != hardening ]; then yarn install --production=true; fi
 ---> Using cache
 ---> 0d554433ab71
Step 45/70 : COPY composer/version.json /composer/version.json
 ---> Using cache
 ---> 856442a99c81
Step 46/70 : FROM ${BASE_IMAGE}:${TAG}
 ---> 6b7dfa7e8fdb
Step 47/70 : COPY TARGET_MODE /TARGET_MODE
 ---> Using cache
 ---> 6b841223bf21
Step 48/70 : COPY etc /etc
 ---> Using cache
 ---> ea5fab0ea7ba
Step 49/70 : RUN apt-get update && apt-get install -y --no-install-recommends         ca-certificates                 curl            		bash			        supervisor      	        wmctrl          	        cups-client     	        pulseaudio-utils                xauth                           websockify			tightvncpasswd			openssl                 	tigervnc-standalone-server	     && ln -s /usr/bin/tightvncpasswd /usr/bin/vncpasswd      && apt-get clean && rm -rf /var/lib/apt/lists/*
 ---> Using cache
 ---> cf1963ade387
Step 50/70 : RUN apt-get update && apt-get install -y --no-install-recommends 	desktop-file-utils		xdg-user-dirs			x11-xserver-utils      	adwaita-icon-theme		adwaita-qt			xclip				imagemagick		     && apt-get clean && rm -rf /var/lib/apt/lists/*
 ---> Using cache
 ---> d5dd1b0ab494
Step 51/70 : RUN apt-get update && apt-get install -y --no-install-recommends 	obconf-qt			feh                         && apt-get clean && rm -rf /var/lib/apt/lists/*
 ---> Using cache
 ---> a41ee294aa93
Step 52/70 : RUN apt-get update && apt-get install -y --no-install-recommends         qterminal                       xfonts-base                     && apt-get clean                && rm -rf /var/lib/apt/lists/*
 ---> Using cache
 ---> 4fa33496bc9e
Step 53/70 : RUN mkdir -p /tmp/packages
 ---> Using cache
 ---> 6819f5cda625
Step 54/70 : COPY --from=openbox_ubuntu_builder /openbox/libobt*             /tmp/packages/
 ---> Using cache
 ---> 9b2037255487
Step 55/70 : COPY --from=openbox_ubuntu_builder /openbox/openbox_3.6.1*      /tmp/packages/
 ---> Using cache
 ---> 311073e39f44
Step 56/70 : COPY --from=openbox_ubuntu_builder /openbox/libobrender*        /tmp/packages/
 ---> Using cache
 ---> 81bc7206b3f5
Step 57/70 : RUN apt-get update  &&         apt-get install -y --no-install-recommends -f /tmp/packages/libobt2v5_3.6.1-10.1_amd64.deb         &&         apt-get install -y --no-install-recommends -f /tmp/packages/libobrender32v5_3.6.1-10.1_amd64.deb   &&         apt-get install -y --no-install-recommends -f /tmp/packages/openbox_3.6.1-10.1_amd64.deb           &&     apt-get clean && rm -rf /var/lib/apt/lists/*
 ---> Using cache
 ---> 8ed604e7a0d7
Step 58/70 : COPY --from=ubuntu_node_modules_builder /composer /composer
 ---> Using cache
 ---> 71d3c274b089
Step 59/70 : RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -         && apt-get install -y --no-install-recommends  nodejs           && apt-get clean && rm -rf /var/lib/apt/lists/* && node --version
 ---> Using cache
 ---> 46c27898d8c7
Step 60/70 : ADD Arc_OSXbuttons.tar /usr/share/themes
 ---> Using cache
 ---> 71a78973dd90
Step 61/70 : RUN mkdir -p /var/log/desktop /var/run/desktop
 ---> Using cache
 ---> 7d340850614a
Step 62/70 : RUN if [ $(cat /TARGET_MODE) = hardening ]; then echo 'removing /etc/supervisor/conf.d/xterm.conf' &&  rm /etc/supervisor/conf.d/xterm.conf; fi
 ---> Using cache
 ---> 9da24cb2e513
Step 63/70 : ENV ABCDESKTOP_LOCALACCOUNT_DIR "/var/secrets/abcdesktop/localaccount"
 ---> Using cache
 ---> cbe8252608df
Step 64/70 : RUN mkdir -p $ABCDESKTOP_LOCALACCOUNT_DIR
 ---> Using cache
 ---> 233a6234ff64
Step 65/70 : RUN for f in passwd shadow group gshadow ; do if [ -f /etc/$f ] ; then  cp /etc/$f $ABCDESKTOP_LOCALACCOUNT_DIR ; rm -f /etc/$f; ln -s $ABCDESKTOP_LOCALACCOUNT_DIR/$f /etc/$f; fi; done
 ---> Using cache
 ---> 06f15edc90c1
Step 66/70 : RUN date > /etc/build.date
 ---> Using cache
 ---> cd3cd29f2a46
Step 67/70 : RUN apt-get update  &&  apt-get install                sudo                        && apt-get clean                && rm -rf /var/lib/apt/lists/*
 ---> Using cache
 ---> d3cbee196390
Step 68/70 : RUN echo "ALL ALL=(ALL:ALL) ALL" > /etc/sudoers.d/all
 ---> Using cache
 ---> a6426f62ffd9
Step 69/70 : CMD [ "/composer/docker-entrypoint.sh" ]
 ---> Using cache
 ---> ce226e18926f
Step 70/70 : EXPOSE 6081 29781 29784 29786
 ---> Using cache
 ---> e7f66952b6b0
[Warning] One or more build-args [BASE_IMAGE_RELEASE] were not consumed
Successfully built e7f66952b6b0
Successfully tagged abcdesktopio/oc.user.ubuntu:3.0
```



### Build image based on alpine

The Alpine Docker image is frequently used as the base for container images, to reduce the image size.
Alpine uses the musl C standard library, while Ubuntu, Debian, and Fedora use glibc. Here is a detailed comparison of the two libraries.

> Linux distributions built on musl, most notably Alpine, do not support application being compiled against glibc and not musl.

Please read musl-vs-glibc https://octopus.com/blog/using-alpine-docker-image#musl-vs-glibc

> Most Linux distributions use the GNU version (glibc) of the standard C library that is required by pretty much every C program, including Python. But Alpine Linux uses musl, those binary wheels are compiled against glibc, and therefore Alpine disabled Linux wheel support.

To build the alpine based image, run `make alpine` :


```bash
make alpine
echo kubernetes > TARGET_MODE
docker build \
    --no-cache=false \
    --build-arg BASE_IMAGE_RELEASE=latest \
            --build-arg BASE_IMAGE=alpine \
            --output "type=docker" \
    --tag abcdesktopio/oc.user.alpine:3.0 \
            --file ./Dockerfile.alpine .
Sending build context to Docker daemon  32.58MB
Step 1/60 : ARG TARGETPLATFORM
Step 2/60 : ARG BUILDPLATFORM
Step 3/60 : ARG BASE_IMAGE_RELEASE=edge
Step 4/60 : ARG BASE_IMAGE=alpine
Step 5/60 : FROM ${BASE_IMAGE}:${BASE_IMAGE_RELEASE} as openbox_alpine_builder
 ---> b2aa39c304c2
Step 6/60 : RUN apk add gcc make g++ bash build-base alpine-sdk sudo wget python3
 ---> Using cache
 ---> 045224443dfc
Step 7/60 : RUN mkdir -p /var/cache/distfiles
 ---> Using cache
 ---> 9aab810daedf
Step 8/60 : RUN mkdir -p /openbox/src
 ---> Using cache
 ---> f6787eac5cf5
Step 9/60 : WORKDIR /openbox
 ---> Using cache
 ---> 056a58e14bce
Step 10/60 : RUN wget https://raw.githubusercontent.com/abcdesktopio/openbox/main/openbox-3.6.1.tar.gz
 ---> Using cache
 ---> e0411f111ed8
Step 11/60 : RUN wget https://git.alpinelinux.org/aports/plain/community/openbox/python3.patch
 ---> Using cache
 ---> 592aaf27da09
Step 12/60 : RUN wget https://raw.githubusercontent.com/abcdesktopio/openbox/main/APKBUILD
 ---> Using cache
 ---> 7ee715e7c4ac
Step 13/60 : RUN wget https://raw.githubusercontent.com/abcdesktopio/openbox/main/openbox.title.patch
 ---> Using cache
 ---> 34ff71c32f17
Step 14/60 : RUN abuild-keygen -a -n
 ---> Using cache
 ---> a9caa386621b
Step 15/60 : RUN abuild -F deps
 ---> Using cache
 ---> 451fa3642c77
Step 16/60 : RUN apkgrel -a APKBUILD
 ---> Using cache
 ---> 90f0d6f65773
Step 17/60 : RUN abuild -F
 ---> Using cache
 ---> cbdcb5668b90
Step 18/60 : FROM ${BASE_IMAGE}:${BASE_IMAGE_RELEASE} as alpine_node_modules_builder
 ---> b2aa39c304c2
Step 19/60 : COPY TARGET_MODE /TARGET_MODE
 ---> Using cache
 ---> 05658c529538
Step 20/60 : RUN apk add  --no-cache --update  	python3			nodejs			yarn		        make			gcc			g++			libx11-dev 		libxmu-dev
 ---> Using cache
 ---> c30880cad43c
Step 21/60 : COPY composer /composer
 ---> Using cache
 ---> 7adb9b6267f1
Step 22/60 : RUN mkdir -p /composer/node/wait-port 	&&     cd /composer/node/wait-port 	&&     yarn add wait-port@1.0.1
 ---> Using cache
 ---> cfa10e2eb6a6
Step 23/60 : WORKDIR /composer/node/common-libraries
 ---> Using cache
 ---> af54002448d2
Step 24/60 : RUN   yarn install --production=true
 ---> Using cache
 ---> 18c4eacb828f
Step 25/60 : WORKDIR /composer/node/broadcast-service
 ---> Using cache
 ---> b6a79d5b0e58
Step 26/60 : RUN yarn install --production=true
 ---> Using cache
 ---> be49a9ad1343
Step 27/60 : WORKDIR /composer/node/ocrun
 ---> Using cache
 ---> 7f19c82b18be
Step 28/60 : RUN yarn install --production=true
 ---> Using cache
 ---> 89ef184581e3
Step 29/60 : WORKDIR /composer/node/ocdownload
 ---> Using cache
 ---> 411e53b3aafa
Step 30/60 : RUN yarn install --production=true
 ---> Using cache
 ---> 75711c29fd3d
Step 31/60 : WORKDIR /composer/node/occall
 ---> Using cache
 ---> b6c73e9545a9
Step 32/60 : RUN yarn install --production=true
 ---> Using cache
 ---> d447e99a04ce
Step 33/60 : WORKDIR /composer/node/spawner-service
 ---> Using cache
 ---> 4a443db250ee
Step 34/60 : RUN yarn global add node-gyp
 ---> Using cache
 ---> f3771f5f1ace
Step 35/60 : RUN yarn install --production=true
 ---> Using cache
 ---> fae7f32f5c9a
Step 36/60 : WORKDIR /composer/node/xterm.js
 ---> Using cache
 ---> 3644a79cf1c6
Step 37/60 : RUN if [ $(cat /TARGET_MODE) != hardening ]; then yarn install --production=true; fi
 ---> Using cache
 ---> 11eb49aa7a81
Step 38/60 : FROM ${BASE_IMAGE}:${BASE_IMAGE_RELEASE}
 ---> b2aa39c304c2
Step 39/60 : COPY TARGET_MODE /TARGET_MODE
 ---> Using cache
 ---> 05658c529538
Step 40/60 : COPY etc /etc
 ---> Using cache
 ---> ca7342371b00
Step 41/60 : RUN echo "https://dl-cdn.alpinelinux.org/alpine/edge/main"      >> /etc/apk/repositories &&     echo "https://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories &&     echo "https://dl-cdn.alpinelinux.org/alpine/edge/testing"   >> /etc/apk/repositories
 ---> Using cache
 ---> 573f8e06a4aa
Step 42/60 : RUN apk add --no-cache --update 	gcompat				python3			        curl            		bash			        supervisor      	        tigervnc        	        wmctrl          	        cups-client     	        pulseaudio-utils                xauth                           websockify			openssl				krb5
 ---> Using cache
 ---> 74ee3bd1e24b
Step 43/60 : RUN apk add --no-cache --update 	desktop-file-utils		xdg-user-dirs			xhost                           xsetroot		adwaita-icon-theme		adwaita-qt			xclip				imagemagick			libadwaita
 ---> Using cache
 ---> a08f0db91ecd
Step 44/60 : RUN apk add  --no-cache --update  	terminus-font			qterminal
 ---> Using cache
 ---> 0ea813648a21
Step 45/60 : RUN apk add  --no-cache --update          ttf-inconsolata 	        ttf-dejavu 			ttf-font-awesome 		font-noto-extra		        font-noto
 ---> Using cache
 ---> d584e8c63044
Step 46/60 : COPY --from=openbox_alpine_builder /root/packages /tmp/packages
 ---> Using cache
 ---> d9594aadb89e
Step 47/60 : RUN apk add --allow-untrusted 	/tmp/packages/$(apk add --print-arch)/openbox-libs-3.6.1*		/tmp/packages/$(apk add --print-arch)/openbox-3.6.1*
 ---> Using cache
 ---> 8251b5dc9529
Step 48/60 : RUN apk add --no-cache --update         obconf-qt                       nodejs                          feh
 ---> Using cache
 ---> 200e9d208443
Step 49/60 : COPY --from=alpine_node_modules_builder /composer /composer
 ---> Using cache
 ---> 790456aa88d2
Step 50/60 : ADD Arc_OSXbuttons.tar /usr/share/themes
 ---> Using cache
 ---> aed723e3b42e
Step 51/60 : COPY composer/version.json /composer/version.json
 ---> Using cache
 ---> b3ccc7d18aa9
Step 52/60 : RUN mkdir -p /var/log/desktop /var/run/desktop
 ---> Using cache
 ---> 481de5ae6bc4
Step 53/60 : ENV ABCDESKTOP_LOCALACCOUNT_DIR "/var/secrets/abcdesktop/localaccount"
 ---> Using cache
 ---> 5262774ad7f6
Step 54/60 : RUN mkdir -p $ABCDESKTOP_LOCALACCOUNT_DIR
 ---> Using cache
 ---> 5112ba0131e5
Step 55/60 : RUN for f in passwd shadow group gshadow ; do if [ -f /etc/$f ] ; then  cp /etc/$f $ABCDESKTOP_LOCALACCOUNT_DIR ; rm -f /etc/$f; ln -s $ABCDESKTOP_LOCALACCOUNT_DIR/$f /etc/$f; fi; done
 ---> Using cache
 ---> 3289bcf89b4e
Step 56/60 : RUN date > /etc/build.date
 ---> Using cache
 ---> 9e3facf5896c
Step 57/60 : RUN apk add  --no-cache --update  	        sudo					vim
 ---> Using cache
 ---> f94c41210d81
Step 58/60 : RUN echo "ALL ALL=(ALL:ALL) ALL" > /etc/sudoers.d/all
 ---> Using cache
 ---> 872057b5c968
Step 59/60 : CMD [ "/composer/docker-entrypoint.sh" ]
 ---> Using cache
 ---> 6d636bd7f565
Step 60/60 : EXPOSE 6081 29781 29784 29786
 ---> Using cache
 ---> 343b79a554e2
Successfully built 343b79a554e2
Successfully tagged abcdesktopio/oc.user.alpine:3.0
```



## To get more informations

Please, read the public documentation web site:
* [https://abcdesktopio.github.io/](https://abcdesktopio.github.io/)

