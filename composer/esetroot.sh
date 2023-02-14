#!/bin/bash
bgColor=$1 
imgName=$2
killall /usr/bin/feh
/usr/bin/feh --no-fehbg --bg-center --borderless --image-bg "${bgColor}" "${imgName}"
