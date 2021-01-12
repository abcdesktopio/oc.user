#!/bin/bash
LOG_FILE=/var/log/desktop/openbox_autostart.log
echo 'Start autostart' > $LOG_FILE

# set DISPLAY to use
export DISPLAY=:0.0

# make Xauth
# permit xhost from x.x.x.2 to x.x.x.254 modulo 2
# subnet=$(ifconfig eth0 | grep "inet addr" | cut -d ':' -f 2 | cut -d ' ' -f 1 | cut -d '.' -f 1,2,3)


# do not use for 
# Step the loop manually
# openbox shell default is not bash
# i=2
# max=255
# while [ $i -lt $max ]
# do
#    # echo xhost +"$subnet"."$i" >> /tmp/autostart.log
#    xhost +"$subnet"."$i"
#    true $((i=i+1))
# done

# set fonts for Qt applications
# Used by Dropbox for exemple 
xrdb -merge $HOME/.Xressources 2>>$LOG_FILE

# Change default backgroup color in X11
xsetroot -solid '#6ec6f0' 2>>$LOG_FILE

echo 'End autostart' >> $LOG_FILE

