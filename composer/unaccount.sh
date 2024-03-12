#!/bin/bash

ABCDESKTOP_LOCALACCOUNT_DIR=${ABCDESKTOP_LOCALACCOUNT_DIR:-'/etc/localaccount'}

for f in passwd shadow group gshadow ; do  
	rm -f /etc/$f; 
 	echo "replace file /etc/$f by $ABCDESKTOP_LOCALACCOUNT_DIR/$f";
	cp "$ABCDESKTOP_LOCALACCOUNT_DIR/$f" "/etc/$f"; 
done
