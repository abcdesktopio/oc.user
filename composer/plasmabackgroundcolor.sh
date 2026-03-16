#!/bin/bash
bgColor=$1 
ABCDESKTOP_LOG_DIR=${ABCDESKTOP_LOG_DIR:-'/var/log/desktop'}
ESETROOT_LOGFILE=$ABCDESKTOP_LOG_DIR/plasmabackgroundcolor.log

echo "bgColor=$bgColor" &>> $ESETROOT_LOGFILE
if [ ! -z "$bgColor" ]; then
	echo "set-backgroundcolor $bgColor" &>> $ESETROOT_LOGFILE
       	exec /composer/set-backgroundcolor.sh "${bgColor}"
fi

exit 1
