#!/bin/bash
RrbgColor=$1
GrbgColor=$2
BrbgColor=$3
imgName=$4

imgParam=''
ABCDESKTOP_LOG_DIR=${ABCDESKTOP_LOG_DIR:-'/var/log/desktop'}
ESETROOT_LOGFILE=$ABCDESKTOP_LOG_DIR/esetroot.log
echo "bgColor=$RrbgColor $GrbgColor $BrbgColor" &>> $ESETROOT_LOGFILE
echo "imgName=$imgName" &>> $ESETROOT_LOGFILE

/usr/bin/xfconf-query --create -c xfce4-desktop -p /backdrop/screen0/monitorVNC-0/workspace0/rgba1 -t double -t double -t double -t double -s $RrbgColor -s $GrbgColor -s $BrbgColor -s 1


if [ ! -z "$imgName" ]; then
  # set image style to centered 
  /usr/bin/xfconf-query --create -c xfce4-desktop -p /backdrop/screen0/monitorVNC-0/workspace0/image-style -s 1
  # set image 
  /usr/bin/xfconf-query --create -c xfce4-desktop -p /backdrop/screen0/monitorVNC-0/workspace0/last-image -s "$imgName"
else
  # set solid color
  /usr/bin/xfconf-query --create -c xfce4-desktop -p /backdrop/screen0/monitorVNC-0/workspace0/color-style -s 0
fi
