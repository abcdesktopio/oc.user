#!/bin/bash
builddate=$(git log -1 --format=%cd --date=iso)
lastcommit=$(git log -1 --format=%H)
version=$(git rev-list --count HEAD)
target=$1
echo "{ \"date\": \"$builddate\", \"commit\": \"$lastcommit\", \"version\": \"$version\", \"target\": \"$target\" }" > composer/version.json
