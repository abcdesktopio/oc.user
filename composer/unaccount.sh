#!/bin/bash

if [ -z "$LOCALACCOUNT_PATH" ]; then
	# default path in 3.1 release
	LOCALACCOUNT_PATH='/etc/localaccount'
fi 

for f in passwd shadow group gshadow ; do  
	rm -f /etc/$f; 
 	echo "repplace file /etc/$f by $LOCALACCOUNT_PATH/$f";
	cp "$LOCALACCOUNT_PATH/$f" "/etc/$f"; 
done
