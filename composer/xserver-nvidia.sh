#!/bin/bash -e

export TZ=${TZ:-UTC}
export SIZEW=${SIZEW:-1920}
export SIZEH=${SIZEH:-1080}
export REFRESH=${REFRESH:-60}
export DPI=${DPI:-96}
export CDEPTH=${CDEPTH:-24}
export VIDEO_PORT=${VIDEO_PORT:-DFP}
export ABCDESKTOP_RUN_DIR=${ABCDESKTOP_RUN_DIR:-'/var/run/desktop'}
export NOVNC_ENABLE=${NOVNC_ENABLE:-true}
export DISPLAY=:0 

# Get first GPU device if all devices are available or `NVIDIA_VISIBLE_DEVICES` is not set
if [ "$NVIDIA_VISIBLE_DEVICES" == "all" ]; then
  export GPU_SELECT=$(nvidia-smi --query-gpu=uuid --format=csv | sed -n 2p)
elif [ -z "$NVIDIA_VISIBLE_DEVICES" ]; then
  export GPU_SELECT=$(nvidia-smi --query-gpu=uuid --format=csv | sed -n 2p)
# Get first GPU device out of the visible devices in other situations
else
  export GPU_SELECT=$(nvidia-smi --id=$(echo "$NVIDIA_VISIBLE_DEVICES" | cut -d ',' -f1) --query-gpu=uuid --format=csv | sed -n 2p)
  if [ -z "$GPU_SELECT" ]; then
    export GPU_SELECT=$(nvidia-smi --query-gpu=uuid --format=csv | sed -n 2p)
  fi
fi

if [ -z "$GPU_SELECT" ]; then
  echo "No NVIDIA GPUs detected or nvidia-container-toolkit not configured. Exiting."
  exit 1
fi

# Setting `VIDEO_PORT` to none disables RANDR/XRANDR, do not set this if using datacenter GPUs
if [ "${VIDEO_PORT,,}" = "none" ]; then
  export CONNECTED_MONITOR="--use-display-device=None"
# The X server is otherwise deliberately set to a specific video port despite not being plugged to enable RANDR/XRANDR, monitor will display the screen if plugged to the specific port
else
  export CONNECTED_MONITOR="--connected-monitor=${VIDEO_PORT}"
fi

# Bus ID from nvidia-smi is in hexadecimal format, should be converted to decimal format which Xorg understands, required because nvidia-xconfig doesn't work as intended in a container
HEX_ID=$(nvidia-smi --query-gpu=pci.bus_id --id="$GPU_SELECT" --format=csv | sed -n 2p)
IFS=":." ARR_ID=($HEX_ID)
unset IFS
BUS_ID=PCI:$((16#${ARR_ID[1]})):$((16#${ARR_ID[2]})):$((16#${ARR_ID[3]}))
# A custom modeline should be generated because there is no monitor to fetch this information normally
export MODELINE=$(cvt -r "${SIZEW}" "${SIZEH}" "${REFRESH}" | sed -n 2p)
# Generate /etc/X11/xorg.conf with nvidia-xconfig
nvidia-xconfig --virtual="${SIZEW}x${SIZEH}" --depth="$CDEPTH" --mode=$(echo "$MODELINE" | awk '{print $2}' | tr -d '"') --allow-empty-initial-configuration --no-probe-all-gpus --busid="$BUS_ID" --no-multigpu --no-sli --no-base-mosaic --only-one-x-screen ${CONNECTED_MONITOR}
# Guarantee that the X server starts without a monitor by adding more options to the configuration
sed -i '/Driver\s\+"nvidia"/a\    Option         "ModeValidation" "NoMaxPClkCheck, NoEdidMaxPClkCheck, NoMaxSizeCheck, NoHorizSyncCheck, NoVertRefreshCheck, NoVirtualSizeCheck, NoExtendedGpuCapabilitiesCheck, NoTotalSizeCheck, NoDualLinkDVICheck, NoDisplayPortBandwidthCheck, AllowNon3DVisionModes, AllowNonHDMI3DModes, AllowNonEdidModes, NoEdidHDMI2Check, AllowDpInterlaced"\n    Option         "HardDPMS" "False"' /etc/X11/xorg.conf
# Add custom generated modeline to the configuration
sed -i '/Section\s\+"Monitor"/a\    '"$MODELINE" /etc/X11/xorg.conf
# Prevent interference between GPUs, add this to the host or other containers running Xorg as well
echo -e "Section \"ServerFlags\"\n    Option \"AutoAddGPU\" \"false\"\nEndSection" | tee -a /etc/X11/xorg.conf > /dev/null
# In Section Screen add Option “UseDisplayDevice” “none”
sed -i '/Section\s\+"Screen"/a\    '"Option \"UseDisplayDevice\" \"none\"" /etc/X11/xorg.conf

# Default display is :0 across the container
# Run Xorg server with required extensions
Xorg vt7 -noreset -novtswitch -sharevts -dpi "${DPI}" +extension "GLX" +extension "RANDR" +extension "RENDER" +extension "MIT-SHM" "${DISPLAY}" &

# Wait for X11 to start
echo "Waiting for X socket"
until [ -S "/tmp/.X11-unix/X${DISPLAY/:/}" ]; do sleep 1; done
echo "X socket is ready"

# this should be a docker instance
if [ ! -f /var/secrets/abcdesktop/vnc/password  ]; then
	mkdir -p /var/secrets/abcdesktop/vnc
	echo changemeplease>/var/secrets/abcdesktop/vnc/password	
fi

# Run the x11vnc + noVNC fallback web interface if enabled
# -rfbauth "$ABCDESKTOP_RUN_DIR"/.vnc/passwd
if [ "${NOVNC_ENABLE,,}" = "true" ]; then
  x11vnc -display "${DISPLAY}" -passwdfile /var/secrets/abcdesktop/vnc/password -unixsock /tmp/.x11vnc -shared -forever -repeat -xkb -noipv6 -noxfixes -snapfb -threads -xrandr "resize" -rfbport 5900 &
fi

echo "Session Running. Press [Return] to exit."
read
