all: version user
registry: all push
NOCACHE := false 

ifdef $$NOCACHE
  NOCACHE := $$NOCACHE
endif

version:
	$(shell ./mkversion.sh)

user:
	echo docker > TARGET_MODE
	docker build \
	    --no-cache=$(NOCACHE) \
	    --build-arg BASE_IMAGE_RELEASE=18.04 \
            --build-arg BASE_IMAGE=abcdesktopio/oc.software.18.04 \
            --build-arg TAG=dev \
            --platform linux/amd64 \
            --output "type=docker" \
            --tag abcdesktopio/oc.user.18.04:dev \
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
