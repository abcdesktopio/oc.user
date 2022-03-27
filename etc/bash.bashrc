#!/bin/bash

# set a fancy prompt (non-color, unless we know we "want" color)
case "$TERM" in
    xterm-color|*-256color) color_prompt=yes;;
esac

if [ "$color_prompt" = yes ]; then
        # default green color
        # PS1='${debian_chroot:+($debian_chroot)}\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '
        # blue for AbcDesktop.io
        # PS1='${debian_chroot:+($debian_chroot)}\[\033[01;34m\]\u@abcdesktop\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '
          PS1='${debian_chroot:+($debian_chroot)}\[\033[01;34m\]\u@abcdesktop\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '
else
    PS1='${debian_chroot:+($debian_chroot)}\u@abcdesktop:\w\$ '
fi

# doesn't work this term.js 
# fix it to use color_prompt
PS1='${debian_chroot:+($debian_chroot)}\u@abcdesktop:\w\$ '
