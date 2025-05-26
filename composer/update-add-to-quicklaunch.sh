#!/bin/bash
# this script add line "var launchers=\"${LAUNCHERS}\"; to add-to-quicklaunch.js and runs the script
export ABCDESKTOP_RUN_DIR=${ABCDESKTOP_RUN_DIR:-'/var/run/desktop'}
export ABCDESKTOP_LOG_DIR=${ABCDESKTOP_LOG_DIR:-'var/log/desktop'}
# log ${LAUNCHERS} var content to /var/log/desktop/launchers
echo ${LAUNCHERS} > ${ABCDESKTOP_LOG_DIR}/launchers
# wait for plasmashell running
# else /usr/bin/qdbus  org.kde.plasmashell org.kde.PlasmaShell.evaluateScript failed
until pids=$(/usr/bin/qdbus org.kde.plasmashell 2>/dev/null)
do   
    sleep 1
done
# update launcher 
/usr/bin/qdbus  org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.evaluateScript "var launchers=\"${LAUNCHERS}\";  $(cat /composer/add-to-quicklaunch.js)"
