all: version user
registry: all push
NOCACHE := false 

ifdef $$NOCACHE
  NOCACHE := $$NOCACHE
endif

version:
	$(shell ./mkversion.sh)

user:
	docker build --no-cache=$(NOCACHE) -t oc.user.18.04 .
	docker tag oc.user.18.04 abcdesktopio/oc.user.18.04

build:version  user
	@echo "Build done."

clean:
	docker rmi abcdesktopio/oc.user.18.04

docs:
	cd composer/node/spawner-service && npm run docs
	cd composer/node/file-service && npm run docs

push:
	docker push abcdesktopio/oc.user.18.04
