#!/bin/bash
# 
# this script add line "var launchers=\"${LAUNCHERS}\"; to add-to-quicklaunch.js and runs the javascript
# javascript add-to-quicklaunch update the launcher ison for plasmashell without restarting it
#
#
HEXACOLOR=$1 


export ABCDESKTOP_RUN_DIR=${ABCDESKTOP_RUN_DIR:-'/var/run/desktop'}
export ABCDESKTOP_LOG_DIR=${ABCDESKTOP_LOG_DIR:-'var/log/desktop'}

# find qdbus /usr/lib/qt6/bin/qdbus is not in default PATH
qdbus=/usr/bin/qdbus
if [[ -x /usr/lib/qt6/bin/qdbus ]]; then
        qdbus=/usr/lib/qt6/bin/qdbus
fi
echo ${qdbus}

# wait for plasmashell running
# else /usr/bin/qdbus  org.kde.plasmashell org.kde.PlasmaShell.evaluateScript failed
until pids=$($qdbus org.kde.plasmashell 2>/dev/null)
do
    sleep 1
done

${qdbus} org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.evaluateScript "var hexacolor=\"${HEXACOLOR}\"; $(cat /composer/set-backgroundcolor.js)"

# ${qdbus} org.kde.plasmashell /PlasmaShell color
# kill -HUP $(pidof plasmashell)
