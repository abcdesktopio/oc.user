#!/bin/bash
X11SOCKET=/tmp/.X11-unix/X0
echo "waiting for socket $X11SOCKET"
while [ ! -S $X11SOCKET ]; do
	echo -n '.'
	sleep  0.1
done

/composer/openbox/autostart.sh

# X11VNCSOCKET=/tmp/.x11vnc
# echo "waiting for socket $X11VNCSOCKET"
# while [ ! -S $X11VNCSOCKET ]; do
#         echo -n '.'
#         sleep  0.1
# done


#start openbox
/usr/bin/openbox --sm-disable --config-file /etc/X11/openbox/rc.xml 

# --startup /composer/openbox/autostart.sh
