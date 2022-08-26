#!/bin/bash

XVNC_PARAMS=""
echo "X11LISTEN=$X11LISTEN"
# add -listen $X11LISTEN if $X11LISTEN is set to tcp
if [ "$X11LISTEN" == "tcp" ]; then
	XVNC_PARAMS="-listen $X11LISTEN"
else
        echo "Not listening tcp"
fi

# SendCutText    - Send clipboard changes to clients. (default=1)
# AcceptCutText  - Accept clipboard updates from clients. (default=1)
if [ "$SENDCUTTEXT" == "disable" ]; then
        XVNC_PARAMS="$XVNC_PARAMS -SendCutText=0"
	echo "No Send clipboard changes to clients"
else
        echo "Send clipboard changes to clients"
fi

if [ "$ACCEPTCUTTEXT" == "disable" ]; then
        XVNC_PARAMS="$XVNC_PARAMS -AcceptCutText=0"
	echo "No Accept clipboard updates from clients"
else
        echo "Accept clipboard updates from clients"
fi


echo "XVNC_PARAMS=$XVNC_PARAMS"


/usr/bin/Xvnc :0 zliblevel=5 -auth /home/balloon/.Xauthority -geometry 3840x2160 -SendPrimary=0 -depth 24 -rfbport=-1 -rfbunixpath /tmp/.x11vnc -pn -rfbauth /composer/run/.vnc/passwd -interface ${CONTAINER_IP_ADDR} ${XVNC_PARAMS}

