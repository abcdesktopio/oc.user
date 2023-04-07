#!/bin/bash
for f in passwd shadow group gshadow ; do  
	rm -f /etc/$f; 
	cp /var/secrets/abcdesktop/localaccount/$f /etc/$f; 
done
