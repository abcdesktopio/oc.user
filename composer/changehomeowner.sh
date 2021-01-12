#!/bin/bash
# This script must be run as SUDO_USER
env > /tmp/root.env
chown ${SUDO_USER}:${SUDO_USER} ${HOME}
chmod 755 ${HOME}
# remove all files changehomeowner.sh checkhomeowner.sh sudoers.d/changehomeowner
# furtive mode
rm /composer/changehomeowner.sh /composer/checkhomeowner.sh /etc/sudoers.d/changehomeowner

