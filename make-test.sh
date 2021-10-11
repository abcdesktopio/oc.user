#/bin/bash

IMAGE_RELEASE=$1
echo "Run oc.user test for $RELEASE"
CONTAINER_ID=$(docker run --rm --env TESTING_MODE='true' --env DISABLE_REMOTEIP_FILTERING='enabled' -d $IMAGE_RELEASE )

echo "Container ID: ${CONTAINER_ID}"

echo "Waiting 30s for cupsd and puslaudio"
sleep 30

echo "Run tests..."
docker exec ${CONTAINER_ID} bash -e /composer/node/run-tests.sh

if [ $? -ne 0 ]; then
    echo "Tests failed"
    exit 1
fi

echo "Stop container ${CONTAINER_ID}..."
docker stop -t 0 ${CONTAINER_ID}

echo "Done"
