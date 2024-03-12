#/bin/bash
ABCDESKTOP_LOCALACCOUNT_DIR=${ABCDESKTOP_LOCALACCOUNT_DIR:-'/etc/localaccount'}
for f in passwd shadow group gshadow ; do if [ -f /etc/$f ] ; then  cp /etc/$f $ABCDESKTOP_LOCALACCOUNT_DIR ; rm -f /etc/$f; ln -s $ABCDESKTOP_LOCALACCOUNT_DIR/$f /etc/$f; fi; done
