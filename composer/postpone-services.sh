#!/bin/bash

# start cupsd if file exists
if [ -f /var/run/desktop/abcdesktop_enable_cupsd ]; then
	/usr/bin/supervisorctl start cupsd  >> /var/log/desktop/cupsd.services.log
fi

# start pulseaudio if file exists
if [ -f /var/run/desktop/abcdesktop_enable_pulseaudio ]; then
	/usr/bin/supervisorctl start pusleaudio  >> /var/log/desktop/pulseaudio.services.log
fi
