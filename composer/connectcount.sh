#!/bin/bash
COUNT=$(netstat -t | grep 'ESTABLISHED' | grep 6081 | wc -l)
echo $COUNT


