#/bin/bash

RELEASE=$1
echo "Run oc.user test for $RELEASE"
CONTAINER_ID=$(docker run --rm --env TESTING_MODE='true' -d abcdesktopio/oc.user.self.test.$RELEASE:dev)

echo "Container ID: ${CONTAINER_ID}"

echo "Waiting 30s for cupsd and puslaudio"
sleep 30

echo "Run tests..."
docker exec ${CONTAINER_ID} bash -e /composer/node/run-tests.sh

echo "Stop container ${CONTAINER_ID}..."
docker stop -t 0 ${CONTAINER_ID}

echo "Done"
