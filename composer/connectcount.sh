#!/bin/bash
COUNT=$(netstat -nt | grep 'ESTABLISHED' | grep ':6081 ' | wc -l)
echo $COUNT


