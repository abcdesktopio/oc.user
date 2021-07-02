#!/bin/bash
echo 'waiting for socket /tmp/.x11vnc' 
if [ ! -f /tmp/.x11vnc]; then
	echo '.'
	sleep 1
fi

/usr/bin/python3.6  /composer/websockify.py --unix-target /tmp/.x11vnc 6081

