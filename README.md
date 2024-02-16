# oc.user


This repository contains the source code to build a user desktop container for abcdesktop project.

[![Build and test oc.user images linux/amd64, linux/arm64](https://github.com/abcdesktopio/oc.user/actions/workflows/test_update_linux_amd64.yml/badge.svg)](https://github.com/abcdesktopio/oc.user/actions/workflows/test_update_linux_amd64.yml)
![GNU GPL v2.0 License](https://img.shields.io/github/license/abcdesktopio/oc.user.svg)

abcdesktop.io user container based on ubuntu

## Clone the repository

```bash
git clone -b 3.2 https://github.com/abcdesktopio/oc.user.git
cd oc.user
git submodule update --init --recursive --remote
```

## Build the complete desktop container image

Run the make command to build 

```bash
TAG=3.1 make
```

You should read on stdout

```
use TAG=3.1;
use PROXY=;
use NOCACHE=false;
docker pull ubuntu:22.04
22.04: Pulling from library/ubuntu
5e8117c0bd28: Pull complete 
Digest: sha256:8eab65df33a6de2844c9aefd19efe8ddb87b7df5e9185a4ab73af936225685bb
Status: Downloaded newer image for ubuntu:22.04
docker.io/library/ubuntu:22.04
docker build \
            --no-cache=false \
            --build-arg TARGET_MODE=ubuntu \
            --build-arg ABCDESKTOP_LOCALACCOUNT_DIR=/etc/localaccount \
            --build-arg BASE_IMAGE_RELEASE=22.04 \
            --build-arg BASE_IMAGE=ubuntu \
            --tag abcdesktopio/oc.user.default:3.1 \
    --build-arg LINK_LOCALACCOUNT=true \
    --build-arg ABCDESKTOP_LOCALACCOUNT_DIR=/var/secrets/abcdesktop/localaccount \
            --file Dockerfile.ubuntu .
[+] Building 228.2s (64/64) FINISHED                                                                                                                                         docker:default
 => [internal] load build definition from Dockerfile.ubuntu                                                                                                                            0.0s
 => => transferring dockerfile: 10.23kB                                                                                                                                                0.0s
 => [internal] load .dockerignore                                                                                                                                                      0.0s
 => => transferring context: 55B                                                                                                                                                       0.0s
 => [internal] load metadata for docker.io/library/ubuntu:latest                                                                                                                       1.2s
 => [internal] load build context                                                                                                                                                      0.3s
 => => transferring context: 14.14MB                                                                                                                                                   0.2s
 => [openbox_ubuntu_builder  1/15] FROM docker.io/library/ubuntu:latest@sha256:8eab65df33a6de2844c9aefd19efe8ddb87b7df5e9185a4ab73af936225685bb                                        0.1s
 => [openbox_ubuntu_builder  2/15] RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections                                                                  0.6s
 => [ubuntu_node_modules_builder  2/23] RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections                                                             0.6s
 => [stage-2  2/23] COPY etc /etc                                                                                                                                                      0.1s
 => [stage-2  3/23] RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections &&     apt-get update  &&     apt-get upgrade -y --no-install-recommends &&    20.3s
 => [openbox_ubuntu_builder  3/15] RUN sed -i '/deb-src/s/^# //' /etc/apt/sources.list                                                                                                 0.5s
 => [ubuntu_node_modules_builder  3/23] RUN apt-get update && apt-get install -y  --no-install-recommends         gcc         g++         make                                        17.6s
 => [openbox_ubuntu_builder  4/15] RUN apt-get update                                                                                                                                  5.4s
 => [openbox_ubuntu_builder  5/15] RUN apt-get install -y --no-install-recommends devscripts wget ca-certificates                                                                     21.2s
 => [ubuntu_node_modules_builder  4/23] RUN apt-get update && apt-get install -y  --no-install-recommends         ca-certificates         libx11-dev         libxmu-dev         git   21.3s
 => [stage-2  4/23] RUN apt-get update && apt-get install -y --no-install-recommends  locales         language-pack-en         language-pack-fr         language-pack-de         &&  103.0s
 => [openbox_ubuntu_builder  6/15] RUN apt-get build-dep -y openbox                                                                                                                   40.7s
 => [ubuntu_node_modules_builder  5/23] RUN  mkdir -p /etc/apt/keyrings &&      curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/key  17.7s
 => [ubuntu_node_modules_builder  6/23] COPY composer /composer                                                                                                                        0.3s
 => [ubuntu_node_modules_builder  7/23] WORKDIR /composer/node/wait-port                                                                                                               0.1s
 => [ubuntu_node_modules_builder  8/23] RUN yarn install --production=true && npm i --package-lock-only && npm audit fix                                                               2.8s
 => [ubuntu_node_modules_builder  9/23] WORKDIR /composer/node/common-libraries                                                                                                        0.1s
 => [ubuntu_node_modules_builder 10/23] RUN yarn install --production=true && npm i --package-lock-only && npm audit fix                                                               4.1s
 => [ubuntu_node_modules_builder 11/23] WORKDIR /composer/node/broadcast-service                                                                                                       0.1s
 => [ubuntu_node_modules_builder 12/23] RUN yarn install --production=true && npm i --package-lock-only && npm audit fix                                                              29.2s
 => [openbox_ubuntu_builder  7/15] RUN mkdir -p /openbox/src                                                                                                                           0.5s
 => [openbox_ubuntu_builder  8/15] WORKDIR /openbox                                                                                                                                    0.1s 
 => [openbox_ubuntu_builder  9/15] RUN apt-get source openbox                                                                                                                          1.8s 
 => [openbox_ubuntu_builder 10/15] RUN wget https://raw.githubusercontent.com/abcdesktopio/openbox/main/openbox.title.patch                                                            0.6s 
 => [openbox_ubuntu_builder 11/15] RUN cd openbox-3.6.1 && patch -p2 < ../openbox.title.patch                                                                                          0.4s 
 => [openbox_ubuntu_builder 12/15] RUN cd openbox-3.6.1 && dch -n abcdesktop_sig_usr                                                                                                   0.5s 
 => [openbox_ubuntu_builder 13/15] RUN cd openbox-3.6.1 && EDITOR=/bin/true dpkg-source -q --commit . abcdesktop_sig_usr                                                               1.2s 
 => [openbox_ubuntu_builder 14/15] RUN cd openbox-3.6.1 && debuild -us -uc                                                                                                            37.8s 
 => [ubuntu_node_modules_builder 13/23] WORKDIR /composer/node/ocrun                                                                                                                   0.1s 
 => [ubuntu_node_modules_builder 14/23] RUN yarn install --production=true && npm i --package-lock-only && npm audit fix                                                               3.6s 
 => [ubuntu_node_modules_builder 15/23] WORKDIR /composer/node/ocdownload                                                                                                              0.0s 
 => [ubuntu_node_modules_builder 16/23] RUN yarn install --production=true && npm i --package-lock-only && npm audit fix                                                               2.8s 
 => [ubuntu_node_modules_builder 17/23] WORKDIR /composer/node/occall                                                                                                                  0.0s 
 => [ubuntu_node_modules_builder 18/23] RUN yarn install --production=true && npm i --package-lock-only && npm audit fix                                                               3.1s 
 => [ubuntu_node_modules_builder 19/23] WORKDIR /composer/node/spawner-service                                                                                                         0.1s 
 => [ubuntu_node_modules_builder 20/23] RUN yarn global add node-gyp                                                                                                                   2.2s 
 => [ubuntu_node_modules_builder 21/23] RUN yarn install --production=true                                                                                                            48.7s 
 => [openbox_ubuntu_builder 15/15] RUN ls *.deb                                                                                                                                        0.4s 
 => [stage-2  5/23] RUN apt-get update  &&     tigervncdeburl="https://raw.githubusercontent.com/abcdesktopio/oc.user/main/tigervncserver_1.13.1-1ubuntu1_$(dpkg --print-architectur  20.1s 
 => [stage-2  6/23] RUN apt-get update  &&     apt-get install -y --no-install-recommends         supervisor         wmctrl         cups-client         pulseaudio-utils         xau  16.1s 
 => [ubuntu_node_modules_builder 22/23] RUN if [ "ubuntu" = "hardening" ] ; then rm -rf /composer/node/xterm.js; ls -la /composer/node; else cd /composer/node/xterm.js; yarn instal  17.7s 
 => [stage-2  7/23] RUN apt-get update && apt-get install -y --no-install-recommends  desktop-file-utils  xdg-user-dirs  x11-xserver-utils  adwaita-icon-theme  adwaita-qt  xclip  i  25.5s 
 => [ubuntu_node_modules_builder 23/23] COPY composer/version.json /composer/version.json                                                                                              0.1s
 => [stage-2  8/23] RUN mkdir -p /tmp/packages                                                                                                                                         0.5s
 => [stage-2  9/23] COPY --from=openbox_ubuntu_builder /openbox/libobt*             /tmp/packages/                                                                                     0.1s
 => [stage-2 10/23] COPY --from=openbox_ubuntu_builder /openbox/openbox_3.6.1*      /tmp/packages/                                                                                     0.1s
 => [stage-2 11/23] COPY --from=openbox_ubuntu_builder /openbox/libobrender*        /tmp/packages/                                                                                     0.1s
 => [stage-2 12/23] RUN apt-get update  &&         apt-get install -y --no-install-recommends -f /tmp/packages/*.deb  &&  apt-get install -y --no-install-recommends feh &&     apt-g  9.3s
 => [stage-2 13/23] RUN apt-get update &&     apt-get install -y --no-install-recommends  picom  hsetroot &&     apt-get clean &&     rm -rf /var/lib/apt/lists/*                      6.0s
 => [stage-2 14/23] COPY --from=ubuntu_node_modules_builder /composer /composer                                                                                                        3.5s
 => [stage-2 15/23] RUN mkdir -p /etc/apt/keyrings &&     curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg &&  8.9s
 => [stage-2 16/23] ADD Arc_OSXbuttons.tar /usr/share/themes                                                                                                                           0.1s
 => [stage-2 17/23] RUN mkdir -p /var/log/desktop /var/run/desktop && chmod 777 /var/log/desktop /var/run/desktop                                                                      0.4s
 => [stage-2 18/23] RUN if [ "ubuntu" = "hardening" ] ; then rm -f /etc/supervisor/conf.d/xterm.conf; echo "supervisor xterm.conf has been removed"; fi                                0.5s
 => [stage-2 19/23] RUN groupadd --gid 4096 balloon &&     useradd --create-home --shell /bin/bash --uid 4096 -g balloon balloon &&     echo "balloon:lmdpocpetit" | chpasswd balloon  0.6s
 => [stage-2 20/23] RUN mkdir -p /var/secrets/abcdesktop/localaccount &&     for f in passwd shadow group gshadow ; do if [ -f /etc/$f ] ; then  cp /etc/$f /var/secrets/abcdesktop/l  0.3s
 => [stage-2 21/23] RUN date > /etc/build.date                                                                                                                                         0.5s
 => [stage-2 22/23] RUN if [ "ubuntu" != "hardening" ]; then  apt-get update &&         apt-get install -y --no-install-recommends qterminal xfonts-base &&  apt-get clean && rm -rf   6.9s
 => [stage-2 23/23] WORKDIR /home/balloon                                                                                                                                              0.1s
 => exporting to image                                                                                                                                                                 3.6s
 => => exporting layers                                                                                                                                                                3.6s
 => => writing image sha256:b34015260323107dda00f0389628084cc89a09b029ce1fff7ae8685caa8bd4d3                                                                                           0.0s
 => => naming to docker.io/abcdesktopio/oc.user.default:3.1                                                                                                                            0.0s
docker build \
            --no-cache=false \
            --build-arg TARGET_MODE=ubuntu \
    --build-arg TAG=3.1  \
    --build-arg BASE_IMAGE=abcdesktopio/oc.user.default \
            --tag abcdesktopio/oc.user.ubuntu:3.1 \
            --file Dockerfile.sudo .
[+] Building 7.0s (7/7) FINISHED                                                                                                                                             docker:default
 => [internal] load build definition from Dockerfile.sudo                                                                                                                              0.0s
 => => transferring dockerfile: 1.07kB                                                                                                                                                 0.0s
 => [internal] load .dockerignore                                                                                                                                                      0.0s
 => => transferring context: 55B                                                                                                                                                       0.0s
 => [internal] load metadata for docker.io/abcdesktopio/oc.user.default:3.1                                                                                                            0.0s
 => [1/3] FROM docker.io/abcdesktopio/oc.user.default:3.1                                                                                                                              0.5s
 => [2/3] RUN if [ "ubuntu" != "hardening" ]; then apt-get update && apt-get install -y --no-install-recommends sudo && apt-get clean && rm -rf /var/lib/apt/lists/* && echo "ALL ALL  6.1s
 => [3/3] WORKDIR /home/balloon                                                                                                                                                        0.0s 
 => exporting to image                                                                                                                                                                 0.1s 
 => => exporting layers                                                                                                                                                                0.1s 
 => => writing image sha256:226881893dab1981ca395721dde1bb8697b1ac2ab4cee82d46f3b102b0f15e89                                                                                           0.0s 
 => => naming to docker.io/abcdesktopio/oc.user.ubuntu:3.1 
```

## Start a container desktop 

```
docker run --rm -it abcdesktopio/oc.user.ubuntu:3.1 
```

You should read on stdout

```
NAMESPACE=abcdesktop
X11LISTEN=udp
Container local ip addr is 172.17.0.2
uid=4096(balloon) gid=4096(balloon) groups=4096(balloon)
error not vnc password has been set, everything is going wrong
run a ls -la /var/secrets/abcdesktop/vnc to help troubleshooting
ls: cannot access '/var/secrets/abcdesktop/vnc': No such file or directory
fix use changemeplease as vncpassword
create ~/.store directory
create ~/Desktop directory
create  ~/.config  directory
error PULSEAUDIO_COOKIE is not defined, sound goes wrong
create ~/.config/nautilus directory
create ~/.gtkrc-2.0 file
/home/balloon/.wallpapers does not exist
create /home/balloon/.wallpapers
copy new wallpaper files in /home/balloon/.wallpapers
run xdg-user-dirs-update
KUBERNETES_SERVICE_HOST is not set, this is wrong
fix KUBERNETES_SERVICE_HOST=localhost as dummy value
DEFAULT_WALLPAPER=
SET_DEFAULT_WALLPAPER is not defined, keep default wallpapers config
SET_DEFAULT_COLOR is not defined, keep default value
2023-12-11 12:09:05,383 INFO Included extra file "/etc/supervisor/conf.d/broadcast-service.conf" during parsing
2023-12-11 12:09:05,383 INFO Included extra file "/etc/supervisor/conf.d/novnc.conf" during parsing
2023-12-11 12:09:05,383 INFO Included extra file "/etc/supervisor/conf.d/openbox.conf" during parsing
2023-12-11 12:09:05,383 INFO Included extra file "/etc/supervisor/conf.d/spawner-service.conf" during parsing
2023-12-11 12:09:05,383 INFO Included extra file "/etc/supervisor/conf.d/tigervnc.conf" during parsing
2023-12-11 12:09:05,383 INFO Included extra file "/etc/supervisor/conf.d/xsettingsd.conf" during parsing
2023-12-11 12:09:05,383 INFO Included extra file "/etc/supervisor/conf.d/xterm.conf" during parsing
2023-12-11 12:09:05,387 INFO RPC interface 'supervisor' initialized
2023-12-11 12:09:05,387 CRIT Server 'unix_http_server' running without any HTTP authentication checking
2023-12-11 12:09:05,387 INFO supervisord started with pid 31
2023-12-11 12:09:06,391 INFO spawned: 'xserver' with pid 32
2023-12-11 12:09:06,394 INFO spawned: 'spawner-service' with pid 33
2023-12-11 12:09:06,397 INFO spawned: 'broadcast-service' with pid 34
2023-12-11 12:09:06,401 INFO spawned: 'novnc' with pid 35
2023-12-11 12:09:06,405 INFO spawned: 'openbox' with pid 38
2023-12-11 12:09:06,410 INFO spawned: 'xterm.js' with pid 39
2023-12-11 12:09:07,799 INFO success: spawner-service entered RUNNING state, process has stayed up for > than 1 seconds (startsecs)
2023-12-11 12:09:07,799 INFO success: broadcast-service entered RUNNING state, process has stayed up for > than 1 seconds (startsecs)
2023-12-11 12:09:07,799 INFO success: xterm.js entered RUNNING state, process has stayed up for > than 1 seconds (startsecs)
2023-12-11 12:09:08,800 INFO success: xserver entered RUNNING state, process has stayed up for > than 2 seconds (startsecs)
2023-12-11 12:09:08,800 INFO success: novnc entered RUNNING state, process has stayed up for > than 2 seconds (startsecs)
2023-12-11 12:09:08,801 INFO success: openbox entered RUNNING state, process has stayed up for > than 2 seconds (startsecs)
```


## Run test command

Only docker image format is supported by the `make-test.sh` script.
To test the new image `abcdesktopio/oc.user.ubuntu:3.1`, run the `make-test.sh` script :

```bash
./make-test.sh abcdesktopio/oc.user.ubuntu:3.1
```

You should read after the install process

```
testing spawner-service
yarn run v1.22.19
$ jest --bail
PASS test/process.test.js
PASS test/spawner-service.test.js
PASS test/audio.test.js
PASS test/app.test.js
PASS test/clipboard.test.js
PASS test/desktop.test.js
PASS test/window.test.js
PASS test/screen-mode.test.js

Test Suites: 8 passed, 8 total
Tests:       63 passed, 63 total
Snapshots:   0 total
Time:        2.601 s
Ran all test suites.
Done in 3.17s.
testing broadcast-service
yarn run v1.22.19
$ jest --bail
PASS test/broadcast-service.test.js
  Test broadcast-serivce
    ✓ Should send data {"method":"hello","data":"hello"} (16 ms)
    ✓ Should send data {"method":"proc.killed"} (4 ms)
    ✓ Should send data {"method":"proc.started"} (3 ms)
    ✓ Should send data {"method":"window.list"} (2 ms)
    ✓ Should send data {"method":"printer.new"} (2 ms)
    ✓ Should send data {"method":"display.setBackgroundBorderColor"} (2 ms)
    ✓ Should send data {"method":"ocrun"} (3 ms)
    ✓ Should send data {"method":"logout"} (2 ms)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        0.393 s
Ran all test suites.
Done in 0.98s.
Stop container 0102dc1c03357863fa6872959e5fc3064f415141c454ed867b8b1b403cdd53fa...
0102dc1c03357863fa6872959e5fc3064f415141c454ed867b8b1b403cdd53fa
Done
```

## To get more informations

Please, read the public documentation web site:
* [https://abcdesktopio.github.io/](https://abcdesktopio.github.io/)

