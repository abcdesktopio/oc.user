#!/bin/bash

XVNC_PARAMS=""
echo "X11LISTEN=$X11LISTEN"
# add -listen $X11LISTEN if $X11LISTEN is set to tcp
if [ "$X11LISTEN" == "tcp" ]; then
	XVNC_PARAMS="-listen $X11LISTEN"
else
        echo "Not listening tcp"
fi

/usr/bin/Xvnc :0 zliblevel=5 -auth /home/balloon/.Xauthority -geometry 3840x2160 -SendPrimary=0 -depth 24 -rfbport=-1 -rfbunixpath /tmp/.x11vnc -pn -rfbauth /composer/run/.vnc/passwd -interface ${CONTAINER_IP_ADDR} ${XVNC_PARAMS}

