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

### Build command for docker mode


To build the oc.user image in docker mode, set the build arguemnt value `TARGET_MODE` to `docker`

```
docker buildx build                                     \
  --build-arg TARGET_MODE=docker                        \
  --build-arg BASE_IMAGE_RELEASE=18.04                  \
  --build-arg BASE_IMAGE=abcdesktopio/oc.software.18.04 \             
  --build-arg TAG=dev                                   \
  --platform linux/amd64                                \
  --output "type=docker"                                \
  --tag abcdesktopio/oc.user.18.04:dev                  \
  --file ./Dockerfile .                                 \
```


### Build command for kubernetes mode


To build the oc.user image in kubernetes mode, set the build arguemnt value `TARGET_MODE` to `kubernetes`

```
docker buildx build                                     \
  --build-arg TARGET_MODE=kubernetes                    \
  --build-arg BASE_IMAGE_RELEASE=18.04                  \
  --build-arg BASE_IMAGE=abcdesktopio/oc.software.18.04 \             
  --build-arg TAG=dev                                   \
  --platform linux/amd64                                \
  --output "type=docker"                                \
  --tag abcdesktopio/oc.user.18.04:dev                  \
  --file ./Dockerfile .                                 \
```


## Test command

Only docker image format is supported by the `make-test.sh` script.
To test the new image `abcdesktopio/oc.user.18.04:dev`, run the `make-test.sh` script :

```
./make-test.sh abcdesktopio/oc.user.18.04:dev
```

