#!/bin/bash

DEFAULT_TIMEOUT=5
COUNTER=0
# Start janus before starting pulseaudio
# pulseadio connect to janus server for rtp
POSTPONE_SERVICE="janus cupsd pulseaudio"
sleep $DEFAULT_TIMEOUT
while [  $COUNTER -lt 10 ]; do
        sleep $DEFAULT_TIMEOUT
        echo "Starting supervisor post pone service $COUNTER/10" >> /var/log/desktop/postpone.services.log
        COUNTER=$((COUNTER+1))
        /usr/bin/supervisorctl status >> /var/log/desktop/postpone.services.log
        result=$?
	echo "status return $result" >> /var/log/desktop/postpone.services.log
        if [ $result -eq 0 ]; then
		echo "supervisor service is started" >> /var/log/desktop/postpone.services.log
                for service in $POSTPONE_SERVICE; do
                        /usr/bin/supervisorctl start $service  >> /var/log/desktop/postpone.services.log
                done
                exit 0
        fi
        if [ $result -eq 3 ]; then
                for service in $POSTPONE_SERVICE; do
                        /usr/bin/supervisorctl start $service  >> /var/log/desktop/postpone.services.log
                done
        fi
done
