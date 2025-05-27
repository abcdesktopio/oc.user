#!/bin/bash

ABCDESKTOP_LOCALACCOUNT_DIR=${ABCDESKTOP_LOCALACCOUNT_DIR:-'/etc/localaccount'}

for f in passwd group ; do  
	rm -f /etc/${f}; 
 	echo "replace file /etc/$f by $ABCDESKTOP_LOCALACCOUNT_DIR/$f";
	cp "${ABCDESKTOP_LOCALACCOUNT_DIR}/${f}" "/etc/${f}"; 
done

for f in shadow gshadow ; do
        rm -f /etc/${f};
        echo "replace file /etc/$f by ${ABCDESKTOP_LOCALACCOUNT_DIR}.shadow/$f";
        cp "${ABCDESKTOP_LOCALACCOUNT_DIR}.shadow/${f}" "/etc/${f}";
done
