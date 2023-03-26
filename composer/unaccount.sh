#!/bin/bash
rm /etc/passwd /etc/group /etc/shadow /etc/gshadow
cp /var/secrets/abcdesktop/localaccount/passwd .
cp /var/secrets/abcdesktop/localaccount/gshadow .
cp /var/secrets/abcdesktop/localaccount/shadow .
cp /var/secrets/abcdesktop/localaccount/group .
