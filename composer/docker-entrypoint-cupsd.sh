#!/bin/bash

CONTAINER_IP_ADDR=$(ip route get 1 | awk '{print $7;exit}')
echo "Container local ip addr is $CONTAINER_IP_ADDR"
export CONTAINER_IP_ADDR


# replace CONTAINER_IP_ADDR in listen for pulseaudio
sed -i "s/localhost:631/$CONTAINER_IP_ADDR:631/g" /etc/cups/cupsd.conf 
if [ -f /tmp/krb5cc_4096 ]; then
	# copy the krb5cc from ballon to root 
        cp /tmp/krb5cc_4096 /tmp/krb5cc_0
fi
/usr/sbin/cupsd -c /etc/cups/cupsd.conf -f

