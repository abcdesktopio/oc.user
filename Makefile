all: version kubernetes hardening
registry: all push
NOCACHE ?= false

ifdef NOCACHE
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
	./make-test.sh

kubernetes:
	echo hardening > TARGET_MODE
	docker build \
	    --no-cache=$(NOCACHE) \
	    --build-arg BASE_IMAGE_RELEASE=edge \
            --build-arg BASE_IMAGE=alpine \
            --output "type=docker" \
	    --tag abcdesktopio/oc.user.alpine:$(TAG) \
            --file ./Dockerfile.alpine .

hardening:
	echo hardening > TARGET_MODE
	docker build \
            --no-cache=$(NOCACHE) \
            --build-arg BASE_IMAGE_RELEASE=edge \
            --build-arg BASE_IMAGE=alpine \
            --output "type=docker" \
	    --tag abcdesktopio/oc.user.alpine.hardening:$(TAG) \
            --file ./Dockerfile.alpine .

clean:
	docker rmi abcdesktopio/oc.user.alpine.hardening:$(TAG)
	docker rmi abcdesktopio/oc.user.alpine:$(TAG)

docs:
	cd composer/node/spawner-service && npm run docs
	cd composer/node/file-service && npm run docs

push:
	docker push abcdesktopio/oc.user.alpine.hardening:$(TAG)
	docker push abcdesktopio/oc.user.alpine:$(TAG)

