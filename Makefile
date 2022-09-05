all: version userkubernetes1804 userhardening1804 userhardening2004 userkubernetes2004
registry: all push
NOCACHE ?= false
ifdef $$NOCACHE
  NOCACHE := $$NOCACHE
endif

version:
	$(shell ./mkversion.sh)

themes:
	docker build --no-cache=$(NOCACHE) --tag abcdesktopio/oc.themes --file ./Dockerfile.themes .

userhardening1804:
	echo hardening > TARGET_MODE
	docker build \
	    --no-cache=$(NOCACHE) \
	    --build-arg BASE_IMAGE_RELEASE=18.04 \
            --build-arg BASE_IMAGE=abcdesktopio/oc.software.18.04 \
            --build-arg TAG=dev \
            --platform linux/amd64 \
            --output "type=docker" \
            --tag abcdesktopio/oc.user.kubernetes.hardening.18.04:dev \
            --file ./Dockerfile .

userhardening2004:
	echo hardening > TARGET_MODE
	docker build \
            --no-cache=$(NOCACHE) \
            --build-arg BASE_IMAGE_RELEASE=20.04 \
            --build-arg BASE_IMAGE=abcdesktopio/oc.software.20.04 \
            --build-arg TAG=dev \
            --platform linux/amd64 \
            --output "type=docker" \
            --tag abcdesktopio/oc.user.kubernetes.hardening.20.04:dev \
            --file ./Dockerfile .

userkubernetes1804:
	echo kubernetes > TARGET_MODE
	docker build \
            --no-cache=$(NOCACHE) \
            --build-arg BASE_IMAGE_RELEASE=18.04 \
            --build-arg BASE_IMAGE=abcdesktopio/oc.software.18.04 \
            --build-arg TAG=dev \
            --platform linux/amd64 \
            --output "type=kubernetes" \
            --tag abcdesktopio/oc.user.kubernetes.18.04:dev \
            --file ./Dockerfile .

userkubernetes2004:
	echo kubernetes > TARGET_MODE
	docker build \
            --no-cache=$(NOCACHE) \
            --build-arg BASE_IMAGE_RELEASE=20.04 \
            --build-arg BASE_IMAGE=abcdesktopio/oc.software.20.04 \
            --build-arg TAG=dev \
            --platform linux/amd64 \
            --output "type=kubernetes" \
            --tag abcdesktopio/oc.user.kubernetes.20.04:dev \
            --file ./Dockerfile .

build:version  user
	@echo "Build done."

clean:
	docker rmi abcdesktopio/oc.user.18.04:dev

docs:
	cd composer/node/spawner-service && npm run docs
	cd composer/node/file-service && npm run docs

push:
	docker push abcdesktopio/oc.user.18.04:dev
	docker push abcdesktopio/oc.user.20.04:dev
	docker push abcdesktopio/oc.user.kubernetes.18.04:dev
	docker push abcdesktopio/oc.user.kubernetes.20.04:dev

