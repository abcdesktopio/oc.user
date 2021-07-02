#!/bin/bash
X11VNCSOCKET=/tmp/.x11vnc 
echo "waiting for socket $X11VNCSOCKET"
while [ ! -S $X11VNCSOCKET ]; do
	echo -n '.'
	sleep  0.1
done

/composer/websockify.py --unix-target $X11VNCSOCKET 6081

