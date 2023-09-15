#!/bin/bash
STDOUT_LOGFILE=/var/log/desktop/openbox_autostart.log

log() {
echo "$(date) $1" >> $STDOUT_LOGFILE
}

log "Start autostart"

# Change default backgroup color in X11
hsetroot -solid '#6ec6f0' 2>>$STDOUT_LOGFILE

# 
#
# There are two commonly used ways to allow access to an X server. 
# - ABCDESKTOP used an Xauthority file, which is shared by the clients, and needs no further server-side configuration. 
# - The other is via the xhost list, where configuration is done on the server at runtime (so this is not a permanent change).
#
#

log "ENV_X11LISTEN=$ENV_X11LISTEN"
if [ "$ENV_X11LISTEN" == "tcp" ]; then
	log "running xhost + command"
	xhost + > $STDOUT_LOGFILE
else
	log "Not running xhost command"
fi

# set fonts for Qt applications
# [[ -f ~/.Xresources ]] && xrdb -merge $HOME/.Xresources 2>>$STDOUT_LOGFILE

log "End autostart"
