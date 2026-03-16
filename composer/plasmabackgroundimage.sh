#!/bin/bash
imgName=$1

ABCDESKTOP_LOG_DIR=${ABCDESKTOP_LOG_DIR:-'/var/log/desktop'}
ESETROOT_LOGFILE=$ABCDESKTOP_LOG_DIR/plasmabackgroundcolorandimage.log
echo "imgName=$imgName" &>> $ESETROOT_LOGFILE

if [ ! -z "$imgName" ]; then
	echo "set-wallpaper imgName=$imgName" &>> $ESETROOT_LOGFILE
	exec /composer/set-wallpaper.sh "${imgName}"
fi

exit 1
