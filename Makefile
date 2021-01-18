all: version user
registry: all push
NOCACHE := false 

ifdef $$NOCACHE
  NOCACHE := $$NOCACHE
endif

version:
	$(shell ./mkversion.sh)

user:
	docker build --no-cache=$(NOCACHE) -t abcdesktopio/oc.user.18.04:dev . --build-arg TAG=dev

build:version  user
	@echo "Build done."

clean:
	docker rmi abcdesktopio/oc.user.18.04:dev

docs:
	cd composer/node/spawner-service && npm run docs
	cd composer/node/file-service && npm run docs

push:
	docker push abcdesktopio/oc.user.18.04:dev
