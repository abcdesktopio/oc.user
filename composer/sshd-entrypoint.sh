#!/bin/bash

ABCDESKTOP_SSHD_CONFIG_PATH=${HOME}/custom_ssh
mkdir -p ${ABCDESKTOP_SSHD_CONFIG_PATH}

if [ ! -f ${ABCDESKTOP_SSHD_CONFIG_PATH}/ssh_host_rsa_key ]; then
  ssh-keygen -f ${ABCDESKTOP_SSHD_CONFIG_PATH}/ssh_host_rsa_key -N '' -t rsa
fi

if [ ! -f ${ABCDESKTOP_SSHD_CONFIG_PATH}/ssh_host_dsa_key ]; then
  ssh-keygen -f ${ABCDESKTOP_SSHD_CONFIG_PATH}/ssh_host_dsa_key -N '' -t dsa
fi

# create sshd config
if [ ! -f ${ABCDESKTOP_SSHD_CONFIG_PATH}/sshd_config ]; then
cat << EOF > ${ABCDESKTOP_SSHD_CONFIG_PATH}/sshd_config
Port 2222
HostKey ${ABCDESKTOP_SSHD_CONFIG_PATH}/ssh_host_rsa_key
HostKey ${ABCDESKTOP_SSHD_CONFIG_PATH}/ssh_host_dsa_key
AuthorizedKeysFile  .ssh/authorized_keys
ChallengeResponseAuthentication no
UsePAM no
PasswordAuthentication no
UsePrivilegeSeparation no
Subsystem sftp /usr/lib/ssh/sftp-server
PidFile ${ABCDESKTOP_SSHD_CONFIG_PATH}/sshd.pid
EOF
fi


# start sshd
/usr/sbin/sshd -f ${ABCDESKTOP_SSHD_CONFIG_PATH}/sshd_config -E ${ABCDESKTOP_LOG_DIR}/sshd.log

