#!/bin/bash
bgColor=$1 
imgName=$2

imgParam=''
ABCDESKTOP_LOG_DIR=${ABCDESKTOP_LOG_DIR:-'/var/log/desktop'}
ESETROOT_LOGFILE=$ABCDESKTOP_LOG_DIR/esetroot.log
echo "bgColor=$bgColor" &>> $ESETROOT_LOGFILE
echo "imgName=$imgName" &>> $ESETROOT_LOGFILE

if [ -z "$bgColor" ]; then
	echo bad paramters &>> $ESETROOT_LOGFILE
        exit 1
fi

if [ -x /usr/bin/Esetroot ]; then
        if [ ! -z "$imgName" ]; then
                imgParam="-center -fit ${imgName}"
        fi
        exec /usr/bin/Esetroot -bg "${bgColor}" $imgParam &>> $ESETROOT_LOGFILE
fi

if [ -x /usr/bin/hsetroot ]; then
        if [ ! -z "$imgName" ]; then
                echo "set imgParam"
                imgParam="-center ${imgName}"
        fi
        exec  /usr/bin/hsetroot -solid "${bgColor}" $imgParam &>> $ESETROOT_LOGFILE
fi

if [ ! -z "$imgName" ]; then
        if [ -x /usr/bin/feh ]; then 
                killall /usr/bin/feh &>> $ESETROOT_LOGFILE
                exec /usr/bin/feh --no-fehbg --bg-center --borderless --image-bg "${bgColor}" "${imgName}" &>> $ESETROOT_LOGFILE
        fi
fi

if [ ! -z "$bgColor" ]; then
  echo "last case" &> $ESETROOT_LOGFILE 
  exec /usr/bin/xsetroot -solid $bgColor &>> $ESETROOT_LOGFILE
fi

exit 1
