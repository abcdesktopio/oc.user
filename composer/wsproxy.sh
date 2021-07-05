#!/bin/bash
X11VNCSOCKET=/tmp/.x11vnc 
echo "waiting for socket $X11VNCSOCKET"
while [ ! -S $X11VNCSOCKET ]; do
	echo -n '.'
	sleep  0.1
done


if [ "$USE_CERTBOT_CERTONLY" == "enabled" ]; then
	FQDN="$EXTERNAL_DESKTOP_HOSTNAME.$EXTERNAL_DESKTOP_DOMAIN"
	# certificats files are located in /etc/letsencrypt/live/
	CERT="/etc/letsencrypt/live/$FQDN/fullchain.pem"
	PRIVKEY="/etc/letsencrypt/live/$FQDN/privkey.pem"
	echo "/composer/wsproxy.py --key=$PRIVKEY --cert=$CERT --unix-target $X11VNCSOCKET 6081" > /var/var/deskop/wsproxy.log
	/composer/wsproxy.py --key=$PRIVKEY --cert=$CERT --unix-target $X11VNCSOCKET 6081
else
	/composer/wsproxy.py --unix-target $X11VNCSOCKET 6081
fi

