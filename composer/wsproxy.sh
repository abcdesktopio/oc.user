#!/bin/bash
X11VNCSOCKET=/tmp/.x11vnc 
echo "waiting for socket $X11VNCSOCKET"
while [ ! -S $X11VNCSOCKET ]; do
	echo -n '.'
	sleep  0.1
done


BIND_INTERFACE=''
if [ "$DISABLE_REMOTEIP_FILTERING" == "enabled" ]; then
	BIND_INTERFACE="0.0.0.0:6081"
else
	BIND_INTERFACE="$(hostname -i):6081"
fi
echo "DISABLE_REMOTEIP_FILTERING is $DISABLE_REMOTEIP_FILTERING, listening $BIND_INTERFACE"

#
# add WEBSOCKIFY_HEARTBEAT option
# force nginx ingress websocket timeout
# read https://github.com/abcdesktopio/oc.pyos/issues/2
#
echo "WEBSOCKIFY_HEARTBEAT=$WEBSOCKIFY_HEARTBEAT"
HEARTBEAT_OPTION=''
if [ ! -z "$WEBSOCKIFY_HEARTBEAT" ]; then
	HEARTBEAT_OPTION="--heartbeat=${WEBSOCKIFY_HEARTBEAT}"
fi
echo "HEARTBEAT_OPTION=$HEARTBEAT_OPTION"

if [ "$USE_CERTBOT_CERTONLY" == "enabled" ]; then
	FQDN="$EXTERNAL_DESKTOP_HOSTNAME.$EXTERNAL_DESKTOP_DOMAIN"
	# certificats files are located in /etc/letsencrypt/live/
	CERT="/etc/letsencrypt/live/$FQDN/fullchain.pem"
	PRIVKEY="/etc/letsencrypt/live/$FQDN/privkey.pem"
	echo "/composer/wsproxy.py --key=$PRIVKEY --cert=$CERT --unix-target $X11VNCSOCKET $BIND_INTERFACE6081" > /var/var/deskop/wsproxy.log
	/usr/bin/websockify  $HEARTBEAT_OPTION  --key=$PRIVKEY --cert=$CERT --unix-target=$X11VNCSOCKET $BIND_INTERFACE
else
	/usr/bin/websockify $HEARTBEAT_OPTION $BIND_INTERFACE --unix-target=$X11VNCSOCKET 
	# /composer/wsproxy.py --unix-target=$X11VNCSOCKET $BIND_INTERFACE
fi
