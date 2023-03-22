all: version ubuntu
registry: all push
NOCACHE ?= false

ifndef NOCACHE
  NOCACHE=false
endif

ifndef TAG
 TAG=3.0
endif

version:
	@echo "use TAG=$(TAG)"\;
	@echo "use PROXY=$(PROXY)"\;
	@echo "use NOCACHE=$(NOCACHE)"\;
	$(shell ./mkversion.sh)

test:
	./make-test.sh abcdesktopio/oc.user.ubuntu:$(TAG)

alpine:
	echo kubernetes > TARGET_MODE
	docker pull alpine
	docker build \
	    --no-cache=$(NOCACHE) \
	    --build-arg BASE_IMAGE_RELEASE=latest \
            --build-arg BASE_IMAGE=alpine \
	    --tag abcdesktopio/oc.user.alpine:$(TAG) \
            --file ./Dockerfile.alpine .

alpine.hardening:
	echo hardening > TARGET_MODE
	docker build \
            --no-cache=$(NOCACHE) \
            --build-arg BASE_IMAGE_RELEASE=latest \
            --build-arg BASE_IMAGE=alpine \
	    --tag abcdesktopio/oc.user.alpine.hardening:$(TAG) \
            --file ./Dockerfile.alpine .

ubuntu:
	echo kubernetes > TARGET_MODE
	docker pull ubuntu:22.04
	docker build \
            --no-cache=$(NOCACHE) \
            --build-arg BASE_IMAGE_RELEASE=22.04 \
            --build-arg BASE_IMAGE=ubuntu \
            --tag abcdesktopio/oc.user.ubuntu:$(TAG) \
            --file ./Dockerfile.ubuntu .

ubuntu.hardening:
	echo hardening > TARGET_MODE
	docker build \
            --no-cache=$(NOCACHE) \
            --build-arg BASE_IMAGE_RELEASE=22.04 \
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

