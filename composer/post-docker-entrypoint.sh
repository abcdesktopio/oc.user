#!/bin/bash
DEFAULT_TIMEOUT=5
COUNTER=0
RELEASE=$(lsb_release --release | cut -f2)
POSTPONE_SERVICE="cupsd pulseaudio"
echo "RELEASE=$RELEASE"
if [ $RELEASE == "18.04" ]; then
        POSTPONE_SERVICE="xsettingsd cupsd pulseaudio"
fi
while [  $COUNTER -lt 5 ]; do
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
