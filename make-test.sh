#/bin/bash
DEFAULT_IMAGE=abcdesktopio/oc.user.18.04:dev

IMAGE_RELEASE="${1:-$DEFAULT_IMAGE}"
echo "Run oc.user test for $IMAGE_RELEASE"
CONTAINER_ID=$(docker run --rm --env TESTING_MODE='true' --env DISABLE_REMOTEIP_FILTERING='enabled' -d $IMAGE_RELEASE )
# TIMEOUT in milliseconds
TIMEOUT=30000 

echo "Container ID: ${CONTAINER_ID}"
echo "Waiting for ${CONTAINER_ID}.State.Running..."
until [ "`docker inspect -f {{.State.Running}} $CONTAINER_ID`"=="true" ]; do
    echo '.'
    sleep 0.1;
done;

echo "Waiting for X11 service"
# desktopservicestcpport = { 'x11server': 6081, 'spawner': 29786, 'broadcast': 29784 }"
# wait for X11 
docker exec ${CONTAINER_ID} /composer/node/wait-port/node_modules/.bin/wait-port -t $TIMEOUT 6081
if [ $? -ne 0 ]; then
	echo "docker exec ${CONTAINER_ID} /composer/node/wait-port/node_modules/.bin/wait-port -t $TIMEOUT 6081 command failed"
	exit 1
fi

# get the ip addr of the container
CONTAINER_IP=$(docker exec ${CONTAINER_ID} hostname -i)
if [ $? -ne 0 ]; then
        echo "docker exec ${CONTAINER_ID} hostname -i command failed"
        docker logs ${CONTAINER_ID}
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

MAX_SERVICE_COUNT=9
echo "Waiting for supervisor status"
while true
do
    SERVICE_COUNT=$(docker exec ${CONTAINER_ID} supervisorctl status | grep RUNNING | wc -l)
    echo "SERVICE_COUNT=$SERVICE_COUNT/$MAX_SERVICE_COUNT"
    if [ "$SERVICE_COUNT" -ge "$MAX_SERVICE_COUNT" ]; then
	    break;
    fi
    sleep 1;
done



echo "Container services are started"
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
