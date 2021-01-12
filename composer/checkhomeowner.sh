#!/bin/bash
HOMEBALLOON_OWNER=$(stat -c '%U' $HOME)
echo "$HOME belongs to $HOMEBALLOON_OWNER"
echo "Current user is $USER"
if [ "$HOMEBALLOON_OWNER" != "$USER" ]; then
	if [ -f /composer/changehomeowner.sh ]; then
        	echo "Setting up default ownership of HOME $HOME to $USER"
        	sudo /composer/changehomeowner.sh
	fi
fi
