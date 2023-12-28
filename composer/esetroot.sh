#!/bin/bash
bgColor=$1 
imgName=$2
if [ -x /usr/bin/Esetroot ]; then
      	/usr/bin/Esetroot -bg "${bgColor}" -center -fit  "${imgName}"
else
    if [ -x /usr/bin/hsetroot ]; then
   	 /usr/bin/hsetroot  -solid '${bgColor}' -center "${imgName}"
    else
    	if [ -x /usr/bin/feh ]; then 	
		killall /usr/bin/feh
		/usr/bin/feh --no-fehbg --bg-center --borderless --image-bg "${bgColor}" "${imgName}"
    	fi
    fi
fi
