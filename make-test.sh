#/bin/bash


echo args is $1 
# set default IMAGE_RELEASE to run test
DEFAULT_IMAGE=abcdesktopio/oc.user.ubuntu:3.2
IMAGE_RELEASE=${1:-$DEFAULT_IMAGE}

# show used IMAGE_RELEASE
echo "Run oc.user test for $IMAGE_RELEASE mode=$TARGET_MODE"

#
# create the container
# with env 
#     TESTING_MODE='true' 
#     DISABLE_REMOTEIP_FILTERING='enabled'
#
CONTAINER_ID=$(docker run --rm --env TARGET_MODE="$TARGET_MODE" --env TESTING_MODE='true' --env DISABLE_REMOTEIP_FILTERING='enabled' -d "$IMAGE_RELEASE" )

# define
# TIMEOUT in milliseconds to exec command inside the container
TIMEOUT=120000 

echo "Container ID: ${CONTAINER_ID}"
echo "Waiting for ${CONTAINER_ID}.State.Running..."
until [ "`docker inspect -f {{.State.Running}} $CONTAINER_ID`"=="true" ]; do
    echo '.'
    sleep 1;
done;


# install package before running tests
# list files
echo "Dump test install scripts"
docker exec --user root ${CONTAINER_ID} cat /composer/node/install-tests.sh
echo
echo "Dump test run scripts"
docker exec --user root ${CONTAINER_ID} cat /composer/node/run-tests.sh
echo
echo "Install tests missing dev packages to run test as user root"

# get the ip addr of the container
CONTAINER_IP=$(docker exec ${CONTAINER_ID} hostname -i)
if [ $? -ne 0 ]; then
        echo "docker exec ${CONTAINER_ID} hostname -i command failed"
        docker logs ${CONTAINER_ID}
        exit 1
fi

echo "${CONTAINER_ID} has ip address ${CONTAINER_IP}" 

echo "Waiting for X11 service"
# desktopservicestcpport = { 'x11server': 6081, 'spawner': 29786, 'broadcast': 29784 }"
# wait for X11 
docker exec ${CONTAINER_ID} /composer/node/wait-port/node_modules/.bin/wait-port -t $TIMEOUT $CONTAINER_IP:6081
if [ $? -ne 0 ]; then
	echo "docker exec ${CONTAINER_ID} /composer/node/wait-port/node_modules/.bin/wait-port -t $TIMEOUT $CONTAINER_IP:6081 command failed"
	exit 1
fi


# check if port 29784 is ready
echo "Waiting for broadcast service"
docker exec ${CONTAINER_ID} /composer/node/wait-port/node_modules/.bin/wait-port -t $TIMEOUT $CONTAINER_IP:29784
if [ $? -ne 0 ]; then
        echo "docker exec ${CONTAINER_ID} /composer/node/wait-port/node_modules/.bin/wait-port -t $TIMEOUT $CONTAINER_IP:29784 command failed"
        docker logs ${CONTAINER_ID}
        exit 1
fi

# check if port 29786 is ready
echo "Waiting for spawner service"
docker exec ${CONTAINER_ID} /composer/node/wait-port/node_modules/.bin/wait-port -t $TIMEOUT $CONTAINER_IP:29786
if [ $? -ne 0 ]; then
        echo "docker exec ${CONTAINER_ID} /composer/node/wait-port/node_modules/.bin/wait-port -t $TIMEOUT $CONTAINER_IP:29786 command failed"
        docker logs ${CONTAINER_ID}
        exit 1
fi

# service 
MAX_SERVICE_COUNT=6
echo "TARGET_MODE is $TARGET_MODE"
# test if the image id hardening mode
if [ "$TARGET_MODE" == "hardening" ]; then
	# in hardening xterm service does not exist 
	# reduce the MAX_SERVICE_COUNT
	MAX_SERVICE_COUNT=$(( $MAX_SERVICE_COUNT - 1 ))
fi

echo "waiting for $MAX_SERVICE_COUNT services ready"
TRY_COUNT=0
while [ $TRY_COUNT -le 10 ]
do
    SERVICE_COUNT=$(docker exec ${CONTAINER_ID} supervisorctl status|grep RUNNING|wc -l)
    echo "TRY_COUNT=$TRY_COUNT SERVICE_COUNT=$SERVICE_COUNT/$MAX_SERVICE_COUNT"
    if [ "$SERVICE_COUNT" -ge "$MAX_SERVICE_COUNT" ]; then
	    break;
    fi
    TRY_COUNT=$(( $TRY_COUNT + 1 ))
    sleep $TRY_COUNT;
done
echo "Container services are started TRY_COUNT=$TRY_COUNT SERVICE_COUNT=$SERVICE_COUNT/$MAX_SERVICE_COUNT"

# run tests
echo "Run tests..."
docker exec ${CONTAINER_ID} bash -e /composer/node/run-tests.sh

if [ $? -ne 0 ]; then
    echo "Tests failed"
    docker logs ${CONTAINER_ID}
    exit 1
fi

echo "Stop container ${CONTAINER_ID}..."
docker stop -t 0 ${CONTAINER_ID}

echo "Done"
