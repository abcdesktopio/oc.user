#!/bin/bash
# fixed by richardmeilinger https://github.com/abcdesktopio/oc.user/issues/57
COUNT=$(LC_ALL=C netstat -nt | grep 'ESTABLISHED' | grep ':6081 ' | wc -l)
echo $COUNT


