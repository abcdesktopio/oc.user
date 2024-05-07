#!/bin/bash
#
#
# overwrite_environment_variable_for_application.sh 
# script kubernetes for abcdesktopio
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

if [ -z "${LOG_FILE}" ];
then
    LOG_FILE="/tmp/overwrite_environment_variable_for_application.log"
fi

# $1 message
display_message() {
    printf "%s\n" "$1" > $LOG_FILE
}

function help() {
        cat <<-EOF
abcdesktop setup tool

Usage: overwrite_environment_variable_for_application.sh [OPTION] [--namespace abcdesktop]...
overwrite_environment_variable_for_application.sh returns a list of dict,  json string

Options (exclusives):
 --help                     Display this help and exit

Parameters:
 --type                     Define the abcdesktop type of application, it can be 'ephemeral_container' or 'pod_application'
 
Examples:
    ./overwrite_environment_variable_for_application.sh
    [ { "NVIDIA_VISIBLE_DEVICES": "GPU-38ab400c-8953-69b1-5460-f70aefd40f8b"}, { "MYVAR": "great"} ]}  

    ./overwrite_environment_variable_for_application.sh --type=pod_application 
    [ { "NVIDIA_VISIBLE_DEVICES": "GPU-38ab400c-8953-69b1-5460-f70aefd40f8b"}, { "MYVAR": "great"} ]}  

Notes:
  the output MUST be of JSON list  
  ./overwrite_environment_variable_for_application.sh
  [ { "NVIDIA_VISIBLE_DEVICES": "GPU-b5aebea9-8a25-fb21-631b-7e5da5a60ccb" } ]

Exit status:
 0      if OK,
 1      if any problem

Report bugs to https://github.com/abcdesktopio/conf/issues
EOF
}


opts=$(getopt \
    --longoptions "help,type:" \
    --name "$(basename "$0")" \
    --options "" \
    -- "$@"
)
eval set "--$opts"

while [ $# -gt 0 ]
do
    case "$1" in
        # commands
        --help) help; exit;;
	--type) APPLICATION_TYPE="$2";shift;;
    esac
    shift
done

# add app type ( not required )
if [ ! -z $APPLICATION_TYPE ]; then
 display_message "{ \"APPLICATION_TYPE\" : \"$APPLICATION_TYPE\" }"
fi 

# example for nvidia
NVIDIA_GPU=''
# nvidia test
if [ -d /proc/driver/nvidia ]; then
       # /proc/driver/nvidia exists
       # suppose there is a gpu 
       if [ -x /usr/bin/nvidia-smi ]; then
                # command line /usr/bin/nvidia-smi found
                # nvidia-smi read gpu_uuid
		gpu_uuid=$(nvidia-smi --query-gpu=gpu_uuid --format=csv,noheader)
             	NVIDIA_GPU="{ \"NVIDIA_VISIBLE_DEVICES\" : \"$gpu_uuid\" }"  
        fi
fi

echo "[$NVIDIA_GPU]"

