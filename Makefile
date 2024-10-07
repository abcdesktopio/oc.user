all: version ubuntu2404  
registry: all push
NOCACHE ?= false

ifndef NOCACHE
  NOCACHE=false
endif

ifndef TAG
 TAG=3.3
endif

version:
	@echo "use TAG=$(TAG)"\;
	@echo "use PROXY=$(PROXY)"\;
	@echo "use NOCACHE=$(NOCACHE)"\;
	$(shell ./mkversion.sh)

test:
	./make-test.sh abcdesktopio/oc.user.ubuntu:$(TAG)

alpine:
	docker pull alpine
	docker build \
	    --no-cache=$(NOCACHE) \
	    --build-arg BASE_IMAGE_RELEASE=latest \
            --build-arg BASE_IMAGE=alpine \
	    --tag abcdesktopio/oc.user.alpine:$(TAG) \
            --file ./Dockerfile.alpine .

alpine.hardening:
	docker build \
            --no-cache=$(NOCACHE) \
            --build-arg BASE_IMAGE_RELEASE=latest \
            --build-arg BASE_IMAGE=alpine \
	    --tag abcdesktopio/oc.user.alpine.hardening:$(TAG) \
            --file ./Dockerfile.alpine .




hardening31:
	docker pull ubuntu:22.04
	docker build \
            --no-cache=$(NOCACHE) \
	    --build-arg TARGET_MODE=hardening \
	    --build-arg ABCDESKTOP_LOCALACCOUNT_DIR=/etc/localaccount \
            --build-arg BASE_IMAGE_RELEASE=22.04 \
            --build-arg BASE_IMAGE=ubuntu \
            --tag abcdesktopio/oc.user.hardening:3.1 \
            --file Dockerfile.ubuntu .


ubuntu2204:
	docker pull ubuntu:22.04
	docker build \
            --no-cache=$(NOCACHE) \
            --build-arg TARGET_MODE=ubuntu \
            --build-arg ABCDESKTOP_LOCALACCOUNT_DIR=/etc/localaccount \
            --build-arg BASE_IMAGE_RELEASE=22.04 \
            --build-arg BASE_IMAGE=ubuntu \
            --tag abcdesktopio/oc.user.ubuntu.22.04:$(TAG) \
            --file Dockerfile.ubuntu .

elementary:
	docker pull ghcr.io/elementary/docker:stable
	docker build \
            --no-cache=$(NOCACHE) \
            --build-arg TARGET_MODE=ubuntu \
            --build-arg ABCDESKTOP_LOCALACCOUNT_DIR=/etc/localaccount \
            --build-arg BASE_IMAGE_RELEASE=stable \
            --build-arg BASE_IMAGE=ghcr.io/elementary/docker \
            --tag abcdesktopio/oc.user.elementary.stable:$(TAG) \
            --file Dockerfile.ubuntu .
	docker build \
            --no-cache=$(NOCACHE) \
            --build-arg TARGET_MODE=ubuntu \
            --build-arg TAG=$(TAG)  \
            --build-arg BASE_IMAGE=abcdesktopio/oc.user.elementary.stable \
	    --build-arg BASE_IMAGE_RELEASE=$(TAG) \
            --tag abcdesktopio/oc.user.elementary.stable.sudo:$(TAG) \
            --file Dockerfile.sudo .

ubuntu2404:
	docker pull ubuntu:24.04
	docker build \
            --no-cache=$(NOCACHE) \
            --build-arg TARGET_MODE=ubuntu \
            --build-arg ABCDESKTOP_LOCALACCOUNT_DIR=/etc/localaccount \
            --build-arg BASE_IMAGE_RELEASE=24.04 \
            --build-arg BASE_IMAGE=ubuntu \
            --tag abcdesktopio/oc.user.ubuntu.24.04:$(TAG) \
            --file Dockerfile.ubuntu .
	docker build \
            --no-cache=$(NOCACHE) \
            --build-arg TARGET_MODE=ubuntu \
            --build-arg TAG=$(TAG)  \
	    --build-arg BASE_IMAGE_RELEASE=$(TAG) \
            --build-arg BASE_IMAGE=abcdesktopio/oc.user.ubuntu.24.04 \
            --tag abcdesktopio/oc.user.ubuntu.sudo.24.04:$(TAG) \
            --file Dockerfile.sudo .


debian:
	docker pull debian 
	docker build \
            --no-cache=$(NOCACHE) \
            --build-arg TARGET_MODE=ubuntu \
            --build-arg ABCDESKTOP_LOCALACCOUNT_DIR=/etc/localaccount \
            --build-arg BASE_IMAGE_RELEASE=12.6 \
            --build-arg BASE_IMAGE=debian \
            --tag abcdesktopio/oc.user.debian.12.6:$(TAG) \
            --file Dockerfile.ubuntu .

kasm:
	docker pull ubuntu:22.04
	docker build \
            --no-cache=$(NOCACHE) \
            --build-arg TARGET_MODE=ubuntu \
            --build-arg ABCDESKTOP_LOCALACCOUNT_DIR=/etc/localaccount \
            --build-arg TAG=22.04 \
            --build-arg BASE_IMAGE=ubuntu \
            --tag abcdesktopio/oc.user.default.kasm:$(TAG) \
            --file Dockerfile.ubuntu.kasm .


sudo:
	docker build \
            --no-cache=$(NOCACHE) \
            --build-arg TARGET_MODE=ubuntu \
	    --build-arg TAG=$(TAG)  \
	    --build-arg BASE_IMAGE=abcdesktopio/oc.user.ubuntu.24.04:$(TAG) \
            --tag abcdesktopio/oc.user.ubuntu.sudo.24.04:$(TAG) \
            --file Dockerfile.sudo .



selkies:
	docker pull ghcr.io/selkies-project/selkies-gstreamer/py-build:master
	docker pull ghcr.io/selkies-project/selkies-gstreamer/gst-web
	docker pull ghcr.io/selkies-project/selkies-gstreamer/gstreamer:master-ubuntu22.04
	docker build \
	    --build-arg BASE_IMAGE_RELEASE=22.04 \
            --build-arg BASE_IMAGE=abcdesktopio/oc.user.ubuntu:$(TAG) \
	    --tag abcdesktopio/oc.user.ubuntu:selkies \
	    --file Dockerfile.selkies .

ubuntu_noaccount:
	echo kubernetes > TARGET_MODE
	docker pull ubuntu:22.04
	docker build \
            --no-cache=$(NOCACHE) \
            --build-arg BASE_IMAGE_RELEASE=22.04 \
            --build-arg BASE_IMAGE=ubuntu \
            --tag abcdesktopio/oc.user.ubuntu:$(TAG) \
            --file Dockerfile.ubuntu .

nvidia:
	# 
	# nvcr.io/nvidia/cuda:${CUDA_VERSION}-runtime-ubuntu${BASE_IMAGE_RELEASE}
	docker pull nvcr.io/nvidia/cuda:12.4.1-runtime-ubuntu22.04
	docker build \
            --no-cache=$(NOCACHE) \
	    --build-arg ABCDESKTOP_LOCALACCOUNT_DIR=/etc/localaccount \
            --build-arg BASE_IMAGE_RELEASE=12.4.1-runtime-ubuntu22.04 \
            --build-arg BASE_IMAGE=nvcr.io/nvidia/cuda \
            --build-arg UBUNTU_RELEASE=22.04 \
            --tag abcdesktopio/oc.user.ubuntu.nvidia:build \
            --file Dockerfile.ubuntu .
	docker build \
            --no-cache=$(NOCACHE) \
            --build-arg ABCDESKTOP_LOCALACCOUNT_DIR=/etc/localaccount \
            --build-arg BASE_IMAGE_RELEASE=build \
            --build-arg BASE_IMAGE=abcdesktopio/oc.user.ubuntu.nvidia \
            --build-arg UBUNTU_RELEASE=22.04 \
	    --build-arg DRIVER_VERSION=550.90.07 \
            --tag abcdesktopio/oc.user.ubuntu.nvidia:3.3 \
            --file Dockerfile.ubuntu.addons-nvidia .

#nvidia:
#	docker pull ubuntu:22.04
#	docker build \
#            --no-cache=$(NOCACHE) \
#            --build-arg BASE_IMAGE_RELEASE=22.04 \
#            --build-arg BASE_IMAGE=ubuntu \
#	    --build-arg CUDA_VERSION=12.1.0 \
#	    --build-arg UBUNTU_RELEASE=22.04 \
#            --tag abcdesktopio/oc.user.ubuntu.nvidia:$(TAG) \
#            --file Dockerfile.nvidia .

citrix:
	docker build 			\
            --no-cache=$(NOCACHE)  	\
	    --build-arg TAG=$(TAG) 	\
            --build-arg BASE_IMAGE=abcdesktopio/oc.user.ubuntu \
	    --tag abcdesktopio/oc.user.citrix.ubuntu:$(TAG) \
            --file ./Dockerfile.citrix .

ubuntu.hardening:
	echo hardening > TARGET_MODE
	docker build \
            --no-cache=$(NOCACHE) \
	    --build-arg ABCDESKTOP_LOCALACCOUNT_DIR=/etc/localaccount \
            --build-arg BASE_IMAGE_RELEASE=24.04 \
            --build-arg BASE_IMAGE=ubuntu \
            --tag abcdesktopio/oc.user.ubuntu.hardening:$(TAG) \
            --file ./Dockerfile.ubuntu .


clean:
	docker rmi abcdesktopio/oc.user.alpine.hardening:$(TAG)
	docker rmi abcdesktopio/oc.user.alpine:$(TAG)

docs:
	cd composer/node/spawner-service && npm run docs
	cd composer/node/file-service && npm run docs

push:
	docker push abcdesktopio/oc.user.alpine.hardening:$(TAG)
	docker push abcdesktopio/oc.user.alpine:$(TAG)

