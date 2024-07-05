#!/bin/bash

XVNC_PARAMS=""
echo "X11LISTEN=${X11LISTEN}"
# add -listen $X11LISTEN if $X11LISTEN is set to tcp
if [ "${X11LISTEN}" == "tcp" ]; then
	XVNC_PARAMS="-listen ${X11LISTEN}"
else
        echo "Not listening tcp"
fi

# SendCutText    - Send clipboard changes to clients. (default=1)
# AcceptCutText  - Accept clipboard updates from clients. (default=1)
if [ "${SENDCUTTEXT}" == "disabled" ]; then
        XVNC_PARAMS="${XVNC_PARAMS} -SendCutText=0"
	echo "No Send clipboard changes to clients"
else
        echo "Send clipboard changes to clients"
fi

if [ "${ACCEPTCUTTEXT}" == "disabled" ]; then
        XVNC_PARAMS="${XVNC_PARAMS} -AcceptCutText=0"
	echo "No Accept clipboard updates from clients"
else
        echo "Accept clipboard updates from clients"
fi


if [ -z "${CONTAINER_IP_ADDR}" ]; then
	echo "this is wrong CONTAINER_IP_ADDR is not set"
	echo "try to read again" 
	CONTAINER_IP_ADDR=$(hostname -i)
	if [ -z "${CONTAINER_IP_ADDR}" ]; then
		echo "This should be a fatal error listening on all interface"
	else
		XVNC_PARAMS="${XVNC_PARAMS} -interface ${CONTAINER_IP_ADDR}"
	fi
else
	XVNC_PARAMS="${XVNC_PARAMS} -interface ${CONTAINER_IP_ADDR}"
fi

echo "XVNC_PARAMS=${XVNC_PARAMS}"
echo "CONTAINER_IP_ADDR=${CONTAINER_IP_ADDR}"

##
# this section code try to find a render device
RENDER_PARAM=''

if [ -d /dev/dri ]; then
	# try to run /usr/bin/nvidia-smi -L
	# to check if a nvidia device is present
	if /usr/bin/nvidia-smi -L; then
		gpu_bus_id=$(nvidia-smi --query-gpu=gpu_bus_id --format=csv,noheader)
		if [ ${#gpu_bus_id} -eq 16 ]; then
			# we need to find a render device to set the Xvnc -rendernode parameter 
			# The command 'nvidia-smi --query-gpu=gpu_bus_id --format=csv,noheader'
		        # returns 00000000:03:00.0
			# format is 00000000:03:00.0
			# but the device doesn't use the same pci domain name
			# ls -la /dev/dri/by-path
			# lrwxrwxrwx 1 root root  8 juil.  4 21:41 /dev/dri/by-path/pci-0000:03:00.0-card -> ../card1
			# lrwxrwxrwx 1 root root 13 juil.  4 21:41 /dev/dri/by-path/pci-0000:03:00.0-render -> ../renderD129
			# how to translate 00000000:03:00.0 as pci-0000:03:00.0 ?
			# because pci-0000:01:00.0 is expected and not /dev/dri/by-path/00000000:03:00.0
			# 
			# we cut pci domain 00000000 to 0000, but this may be wrong 
			# check this point
	  		gpu_bus_id=${gpu_bus_id:4:12}
        	fi

		rendernode="/dev/dri/by-path/pci-${gpu_bus_id}-render"
		if [ -c "${rendernode}" ]; then 
	        	echo "$rendernode is a character device."	
        		RENDER_PARAM="-rendernode ${rendernode}"
		fi
	else
		# read the first render device entry in /dev/dri
		rendernode=$(ls /dev/dri/render* |head -1)
		if [ -c "${rendernode}" ]; then
                        echo "${rendernode} is a character device."       
                        RENDER_PARAM="-rendernode ${rendernode}"
                fi

	fi
fi

# force geometry if ABCDESKTOP_GEOMETRY is defined
# format 3840x2160
GEOMETRY_PARAM=''
if [ ! -z "${ABCDESKTOP_GEOMETRY}" ]; then
  GEOMETRY_PARAM="-geometry ${ABCDESKTOP_GEOMETRY}"
fi

# set 3840x2160 
# ${RENDER_PARAM} 
# equal to for example -rendernode /dev/dri/by-path/pci-0000:03:00.0-render if a render device exists else empty value
# ${XVNC_PARAMS}  
# equal to for example -SendCutText=0 -AcceptCutText=0 -interface ${CONTAINER_IP_ADDR} if need else empty value
# ${GEOMETRY_PARAM} 
# equal to for example -geometry 3840x2160 if ${ABCDESKTOP_GEOMETRY} env is set 

# dump env
env>${ABCDESKTOP_LOG_DIR}/xserver.env

# start the Xvnc server 
exec /usr/bin/Xvnc :0 -auth ~/.Xauthority ${GEOMETRY_PARAM} -SendPrimary=0 -depth 24 -rfbport=-1 -rfbunixpath /tmp/.x11vnc -pn -rfbauth ${ABCDESKTOP_RUN_DIR}/.vnc/passwd ${XVNC_PARAMS} +extension GLX +extension RANDR +extension MIT-SHM ${RENDER_PARAM}

