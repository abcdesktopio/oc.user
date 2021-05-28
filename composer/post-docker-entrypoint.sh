#!/bin/bash
DEFAULT_TIMEOUT=2
COUNTER=0
# get ubuntu release
RELEASE=$(lsb_release --release | cut -f2)
# based services
POSTPONE_SERVICE="cupsd pulseaudio"
# log info
echo "RELEASE=$RELEASE"
# check if ubuntu release is 18.04 or 20.04
if [[ $RELEASE == "18.04" || $RELEASE == "20.04" ]]; then
        # Add xsettingsd to POSTPONE_SERVICE
        POSTPONE_SERVICE="xsettingsd $POSTPONE_SERVICE"
fi
# loop
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
