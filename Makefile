all: version ubuntu software user cupsd pulseaudio
registry: all push
NOCACHE := false 

ifdef $$NOCACHE
  NOCACHE := $$NOCACHE
endif

version:
	$(shell ./mkversion.sh)

ubuntu:
	docker pull ubuntu:18.04 
	docker build --no-cache=$(NOCACHE) -t oc.ubuntu.18.04 -f oc.ubuntu.18.04 .

software:
	docker build --no-cache=$(NOCACHE) -t oc.software.18.04 -f oc.software.18.04 .

user:
	docker build --no-cache=$(NOCACHE) -t oc.user.18.04 -f oc.user.18.04 .
	docker tag oc.user.18.04 abcdesktopio/oc.user.18.04

build:version ubuntu software user cupsd pulseaudio
	@echo "Build done."

clean:
	docker rmi abcdesktopio/oc.ubuntu.18.04
	docker rmi abcdesktopio/oc.software.18.04
	docker rmi abcdesktopio/oc.user.18.04

cupsd:
	docker build --no-cache=$(NOCACHE) -t oc.cupsd.18.04 -f oc.cupsd.18.04 .
	docker tag oc.cupsd.18.04 abcdesktopio/oc.cupsd.18.04

docs:
	cd composer/node/spawner-service && npm run docs
	cd composer/node/file-service && npm run docs

pulseaudio:
	docker build --no-cache=$(NOCACHE) -t oc.pulseaudio.18.04 -f oc.pulseaudio.18.04 .
	docker tag oc.pulseaudio.18.04 abcdesktopio/oc.pulseaudio.18.04

push:
	docker push abcdesktopio/oc.user.18.04
	docker push abcdesktopio/oc.cupsd.18.04
	docker push abcdesktopio/oc.pulseaudio.18.04
