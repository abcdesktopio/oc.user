#/bin/bash

echo "Run oc.user..."
CONTAINER_ID=$(docker run --rm --env TESTING_MODE='true' -d abcdesktopio/oc.user.18.04)
CONTAINER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${CONTAINER_ID})

echo "Container ID: ${CONTAINER_ID}"

echo "Waiting 30s for cupsd and puslaudio"
sleep 30

echo "Run tests..."
docker exec ${CONTAINER_ID} bash -e /composer/node/run-tests.sh ${CONTAINER_IP}

echo "Stop container ${CONTAINER_ID}..."
docker stop -t 0 ${CONTAINER_ID}

echo "Done"
