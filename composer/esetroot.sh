#!/bin/bash
bgColor=$1 
imgName=$2
if [ -x /usr/bin/Esetroot ]; then
      	/usr/bin/Esetroot -bg "${bgColor}" -center -fit  "${imgName}"
else      
     	killall /usr/bin/feh
	/usr/bin/feh --no-fehbg --bg-center --borderless --image-bg "${bgColor}" "${imgName}"
fi
