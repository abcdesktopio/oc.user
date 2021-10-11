# oc.user

## To get more informations

Please, read the public documentation web site:
* [https://abcdesktopio.github.io/](https://abcdesktopio.github.io/)

## oc.user

![Build and test oc.user images](https://github.com/abcdesktopio/oc.user.18.04/workflows/Build%20and%20test%20oc.user%20images/badge.svg)
![Docker Stars](https://img.shields.io/docker/stars/abcdesktopio/oc.user.18.04.svg) 
![Docker Pulls](https://img.shields.io/docker/pulls/abcdesktopio/oc.user.18.04.svg)
![GNU GPL v2.0 License](https://img.shields.io/github/license/abcdesktopio/oc.user.svg)

abcdesktop.io user container based on ubuntu

```
git clone https://github.com/abcdesktopio/oc.user.git
cd oc.user
git submodule update --init --recursive --remote
```

## Build command

```
cd oc.user
docker buildx build             --build-arg BASE_IMAGE_RELEASE=18.04             --build-arg BASE_IMAGE=abcdesktopio/oc.software.18.04             --build-arg TAG=dev             --platform linux/amd64             --output "type=image,push=false"             --tag abcdesktopio/oc.user.18.04:dev             --file ./Dockerfile .
```
