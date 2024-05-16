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
if [ "$SENDCUTTEXT" == "disabled" ]; then
        XVNC_PARAMS="$XVNC_PARAMS -SendCutText=0"
	echo "No Send clipboard changes to clients"
else
        echo "Send clipboard changes to clients"
fi

if [ "$ACCEPTCUTTEXT" == "disabled" ]; then
        XVNC_PARAMS="$XVNC_PARAMS -AcceptCutText=0"
	echo "No Accept clipboard updates from clients"
else
        echo "Accept clipboard updates from clients"
fi


if [ -z "$CONTAINER_IP_ADDR" ]; then
	echo "this is wrong CONTAINER_IP_ADDR is not set"
	echo "try to read again" 
	CONTAINER_IP_ADDR=$(hostname -i)
	if [ -z "$CONTAINER_IP_ADDR" ]; then
		echo "This should be a fatal error listening on all interface"
	else
		XVNC_PARAMS="$XVNC_PARAMS -interface ${CONTAINER_IP_ADDR}"
	fi
else
	XVNC_PARAMS="$XVNC_PARAMS -interface ${CONTAINER_IP_ADDR}"
fi


echo "XVNC_PARAMS=$XVNC_PARAMS"
echo "CONTAINER_IP_ADDR=$CONTAINER_IP_ADDR"

# set 3840x2160 
exec /usr/bin/Xvnc :0 zliblevel=5 -auth ~/.Xauthority -geometry 2560×1600 -SendPrimary=0 -depth 24 -rfbport=-1 -rfbunixpath /tmp/.x11vnc -pn -rfbauth "$ABCDESKTOP_RUN_DIR"/.vnc/passwd ${XVNC_PARAMS} +extension GLX +extension RANDR +extension MIT-SHM
