#!/usr/bin/env bash

# Local vars
#Set Script Name variable
SCRIPT=`basename ${BASH_SOURCE[0]}`

OPT_LOCAL=""
WALLPAPER_PATH=~/.wallpapers
# ABCDESKTOP_SESSION is a random value 
# unique for each desktop
((ABCDESKTOP_SESSION=((RANDOM<<15|RANDOM)<<15|RANDOM)<<15|RANDOM))

## Export Var
export NAMESPACE=${POD_NAMESPACE:-'abcdesktop'}
echo   NAMESPACE=${NAMESPACE}
export LIBOVERLAY_SCROLLBAR=0
export UBUNTU_MENUPROXY=
export DISPLAY=${DISPLAY:-':0'}
export X11LISTEN=${X11LISTEN:-'udp'}
echo   X11LISTEN=${X11LISTEN}
export USER=${USER:-'balloon'}
export HOME=${HOME:-'/home/balloon'}
export LOGNAME=${LOGNAME:-'balloon'}
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:$HOME/.local/share/applications/bin/"
export ABCDESKTOP_RUN_DIR=${ABCDESKTOP_RUN_DIR:-'/var/run/desktop'}
export ABCDESKTOP_SECRETS_DIR="/var/secrets/$NAMESPACE"
export DISABLE_REMOTEIP_FILTERING=${DISABLE_REMOTEIP_FILTERING:-'disabled'}
export BROADCAST_COOKIE=${BROADCAST_COOKIE:-$ABCDESKTOP_SESSION}
export SUPERVISOR_PID_FILE=/var/run/desktop/supervisord.pid
export X11_SIZE_WIDTH=${X11_SIZE_WIDTH:-1920}
export X11_SIZE_HEIGHT=${X11_SIZE_HEIGHT:-1080}

# TRAP for container signal SIGINT SIGQUIT SIGHUP SIGTERM
stop() {
   echo "$(date +'%F %T,%3N') starting stop"
   echo "$(date +'%F %T,%3N') stopping all services"
   /usr/bin/supervisorctl stop all
   if [ -f "${SUPERVISOR_PID_FILE}" ]; then 
	kill -9 $(cat "${SUPERVISOR_PID_FILE}")
   fi 
   echo "$(date +'%F %T,%3N') this is the end..."
}
trap stop SIGINT SIGQUIT SIGHUP SIGTERM


# Read first $POD_IP if not set get from hostname -i ip addr
export CONTAINER_IP_ADDR=${POD_IP:-$(hostname -i)}
echo "Container local ip addr is $CONTAINER_IP_ADDR"

# export DBUS_SESSION_BUS_ADDRESS=tcp:host=localhost,bind=*,port=55556,family=ipv4

# Note that '/home/balloon/.local/share' is not in the search path
# set by the XDG_DATA_HOME and XDG_DATA_DIRS
# environment variables, so applications may not be able to find it until you set them. The directories currently searched are:
#
# - /root/.local/share
# - /usr/local/share/
# - /usr/share/

# set umask to 
# make sur log file can not be read by everyone
umask 027
id

# First start
# Clean lock 
rm -rf /tmp/.X0-lock

# get VNC_PASSWORD 
# use vncpasswd command line to create a vnc passwd file
mkdir -p ${ABCDESKTOP_RUN_DIR}/.vnc
# read the vnc password from the kubernetes secret
if [ -f ${ABCDESKTOP_SECRETS_DIR}/vnc/password ]; then
        echo 'vnc password use kubernetes secret'
	cat ${ABCDESKTOP_SECRETS_DIR}/vnc/password | vncpasswd -f > ${ABCDESKTOP_RUN_DIR}/.vnc/passwd
else
	echo 'error not vnc password has been set, everything is going wrong'
	echo "run a ls -la ${ABCDESKTOP_SECRETS_DIR}/vnc to help troubleshooting"
	ls -la ${ABCDESKTOP_SECRETS_DIR}/vnc
	echo 'fix use changemeplease as vncpassword'
	echo changemeplease | vncpasswd -f > ${ABCDESKTOP_RUN_DIR}/.vnc/passwd
fi


# create a MIT-MAGIC-COOKIE-1 entry in .Xauthority
if [ ! -z "$XAUTH_KEY" ]; then
 	# reset file content
 	true > ~/.Xauthority
	xauth add :0 MIT-MAGIC-COOKIE-1 $XAUTH_KEY
fi

if [ ! -d ~/.store ]; then  
	echo "create ~/.store directory"
	mkdir -p ~/.store &
fi

if [ ! -d ~/Desktop ]; then
	echo "create ~/Desktop directory"
        mkdir -p ~/Desktop &
fi

if [ ! -d ~/.config ]; then
	echo "create  ~/.config  directory"
        mkdir -p ~/.config
        cp -r /composer/.config ~
fi

if [ ! -z "$PULSEAUDIO_COOKIE" ]; then
	# create ~/.config/pulse if not exist
	mkdir -p ~/.config/pulse
 	# remove file content ~/.config/pulse/cookie 
 	true > ~/.config/pulse/cookie
	# create a 256 Bytes cookie file for pulseaudio
	for i in {1..8} 
	do 
		echo -n "$PULSEAUDIO_COOKIE" >> ~/.config/pulse/cookie
	done
 else
 	echo "error PULSEAUDIO_COOKIE is not defined, sound goes wrong"
fi

if [ ! -d ~/.config/gtk-3.0 ]; then
	echo "create  ~/.config/gtk-3.0 directory"
        mkdir -p ~/.config/gtk-3.0
        cp -r /composer/.config/gtk-3.0 ~/.config &
fi

if [ ! -f ~/.config/gtk-3.0/settings.ini ]; then
	echo "copy ~/.config/gtk-3.0/settings.ini file"
        cp /composer/.config/gtk-3.0/settings.ini ~/.config/gtk-3.0 &
fi

if [ ! -d ~/.config/nautilus ]; then
	echo "create ~/.config/nautilus directory"
        mkdir -p ~/.config/nautilus
fi

# if [ ! -d ~/.themes ]; then
#	echo "create ~/.themes directory"
#	cp -rp /composer/.themes ~ &
# fi


#
# read https://wiki.archlinux.org/title/GTK#:~:text=Depending%20on%20GTK%20version%2C%20these,etc%2Fgtk%2D2.0%2Fgtkrc
if [ ! -f ~/.gtkrc-2.0 ]; then
	echo "create ~/.gtkrc-2.0 file"
	cp -rp /composer/.gtkrc-2.0 ~
fi


if [ ! -f ~/.gtk-bookmarks ]; then
        touch ~/.gtk-bookmarks
fi

# if [ ! -f ~/.xsettingsd ]; then
# 	cp -rp /composer/.xsettingsd ~
# fi

if [ ! -d ~/.gconf ]; then
        cp -rp /composer/.gconf ~
fi

if [ ! -d ~/.gconf/apps ]; then
       	cp -rp /composer/.gconf/apps ~/.gconf
       	chmod -R 700 ~/.gconf/apps
fi

if [ ! -f ~/.Xresources ];  then
	cp -p /composer/.Xresources ~
fi

if [ ! -d ~/.wallpapers ]; then
  	# add default wallpapers 
  	# we can't run a link if home dir is configured as a dedicated volume
	echo ~/.wallpapers does not exist
	echo create ~/.wallpapers
  	mkdir ~/.wallpapers
	echo copy new wallpaper files in ~/.wallpapers
	cp -rp /composer/wallpapers/* ~/.wallpapers
  	# cp -rp /composer/wallpapers/* ~/.wallpapers &
	# cp_pid=$!
	# echo "TESTING_MODE=$TESTING_MODE"
	# # if we are in testing mode wait for cp command finnish
	# if [ ! -z "$TESTING_MODE" ]; then
	# 	echo "We are in testing mode, waiting for cp command complete"
	#	wait $cp_pid
	#	echo "~/.wallpapers dump"
	#	ls -la ~/.wallpapers
	# fi
fi

if [ ! -f ~/.config/user-dirs.dirs ]; then
	echo "run xdg-user-dirs-update"
	# xdg-user-dirs-update --force
	# export $(grep -v '^#' user-dirs.dirs | xargs -0)
	xdg-user-dirs-update &
fi 

# create .local entries
# mkdir -p ~/.local/share/icons   
mkdir -p ~/.local/share/mime
mkdir -p ~/.local/share/applications/bin

if [ ! -d ~/.local/share/icons ]; then
  	cp -rp /composer/icons ~/.local/share &
fi

# if [ ! -d ~/.local/share/mime ]; then
  	# cp -rp /composer/mime ~/.local/share
  	# update-mime-database ~/.local/share/mime > /var/log/desktop/update-mime-database.log &
# fi

## DBUS Section
# source https://georgik.rocks/how-to-start-d-bus-in-docker-container/
# source https://stackoverflow.com/questions/10158684/connecting-to-dbus-over-tcp
# if [ ! -f /var/lib/dbus/machine-id ]; then
#   echo 'starting dbus-uuidgen > /var/lib/dbus/machine-id' >> /var/log/desktop/dbus.log
#   dbus-uuidgen > /var/lib/dbus/machine-id &
# fi
# 
# if [ ! -d /var/run/dbus ]; then 
# 	mkdir -p /var/run/dbus
# fi

## LANG SECTION
# set lang
# ALL_LANG="LC_ALL LC_PAPER LC_ADDRESS LC_MONETARY LC_TIME LC_MEASUREMENT LC_IDENTIFICATION LC_TELEPHONE LC_NUMERIC"
#if [ ! -z $LANG ] ; then
#        for l in $ALL_LANG ; do
#                if [ -z $l ] ; then
#                        export $l=$LANG
#                fi;
#                echo $l=${!l}
#	done
#fi


# check if user bind local interface
# mode bridge and need to build a new x509 certificat USE_CERTBOT_CERTONLY
if [ "$USE_CERTBOT_CERTONLY" == "enabled" ]; then
	FQDN="$EXTERNAL_DESKTOP_HOSTNAME.$EXTERNAL_DESKTOP_DOMAIN"
	echo "FQDN=$FQDN"
	# call letsencrypt to build a new X509 certificat
	# try 5 call to certbot
	
	counter=0
	max_counter=5
	until [ $counter -gt $max_counter ]
	do
		echo "/usr/bin/certbot certonly --standalone -d $FQDN -m ssl@$EXTERNAL_DESKTOP_DOMAIN --agree-tos --non-interactive"
		/usr/bin/certbot certonly --standalone -d $FQDN -m ssl@$EXTERNAL_DESKTOP_DOMAIN --agree-tos --non-interactive
		certbot_return_code=$?
        	if [ $certbot_return_code -eq 0 ]; then
			echo "command certbot success $certbot_return_code"
			break
		fi
		echo certbot_return_code=$certbot_return_code
  		echo retrying: $counter/$max_counter
 	 	((counter++))
		# wait one second for dns zone update
		sleep 1
	done
else
	# make sure that vars exist
	# for supervisor configuration ENV expand process
        export USE_CERTBOT_CERTONLY=disabled
	export EXTERNAL_DESKTOP_HOSTNAME=''
	export EXTERNAL_DESKTOP_DOMAIN=''
fi

export USE_CERTBOT_CERTONLY
export EXTERNAL_DESKTOP_HOSTNAME
export EXTERNAL_DESKTOP_DOMAIN

# # Check if need to start dbus session
#if [ ! -z "$OD_DBUS_SESSION_BUS" ]; then
#   echo "starting OD_DBUS_SESSION_BUS is set $OD_DBUS_SESSION_BUS" >> /var/log/desktop/dbus.log
#   dbus_session=$(dbus-daemon --config-file=/usr/share/dbus-1/session.conf --print-address --fork --nosyslog)
#   if [ $? -eq 0 ]; then
#   	echo "export DBUS_SESSION_BUS_ADDRESS=$dbus_session" > ~/.DBUS_SESSION_BUS
#	chmod 755  ~/.DBUS_SESSION_BUS
#        echo "DBUS_SESSION is set $dbus_session" >> /var/log/desktop/dbus.log
#   else
#	[ -f ~/.DBUS_SESSION_BUS ] && rm ~/.DBUS_SESSION_BUS
#   fi
#fi 

## Check if need to start dbus system
#if [ ! -z "$OD_DBUS_SYSTEM_BUS" ]; then
#   echo "starting OD_DBUS_SYSTEM_BUS is set $OD_DBUS_SYSTEM_BUS" >> /var/log/desktop/dbus.log
#   dbus_system=$(dbus-daemon --config-file=/usr/share/dbus-1/system.conf --print-address  --fork --nosyslog ) 
#   if [ $? -eq 0 ]; then
#   	echo "export DBUS_SYSTEM_BUS_ADDRESS=$dbus_system" > ~/.DBUS_SYSTEM_BUS
#	chmod 755 ~/.DBUS_SYSTEM_BUS
#	echo "DBUS_SYSTEM is set $dbus_system" >> /var/log/desktop/dbus.log
#   else
#	[ -f ~/.DBUS_SYSTEM_BUS ] && rm ~/.DBUS_SYSTEM_BUS
#   fi
#fi


## KERBEROS SECTION
if [ -f ${ABCDESKTOP_SECRETS_DIR}/kerberos/keytab ]; then
	export KRB5_CLIENT_KTNAME=${ABCDESKTOP_SECRETS_DIR}/kerberos/keytab
fi

if [ -f ${ABCDESKTOP_SECRETS_DIR}/kerberos/krb5.conf ]; then
        export KRB5_CONFIG=${ABCDESKTOP_SECRETS_DIR}/kerberos/krb5.conf
fi

if [ -f ${ABCDESKTOP_SECRETS_DIR}/kerberos/PRINCIPAL ]; then
	export USERPRINCIPALNAME=$(cat ${ABCDESKTOP_SECRETS_DIR}/kerberos/PRINCIPAL)
fi

if [ -f ${ABCDESKTOP_SECRETS_DIR}/kerberos/REALM ]; then
        export REALM=$(cat ${ABCDESKTOP_SECRETS_DIR}/kerberos/REALM)
fi

# Now run kinit if all vars are set 
if [ ! -z "$USERPRINCIPALNAME" ] && [ ! -z "$REALM" ] && [ ! -z "$KRB5_CONFIG" ] && [ ! -z "$KRB5_CLIENT_KTNAME" ]; then
echo "/usr/bin/kinit $USERPRINCIPALNAME@$REALM -k -t $KRB5_CLIENT_KTNAME" > /tmp/krb5.log
/usr/bin/kinit "$USERPRINCIPALNAME@$REALM" -k -t "$KRB5_CLIENT_KTNAME" &
fi 
## END OF KERBEROS


# add file start info timedate data
echo `date` > ${ABCDESKTOP_RUN_DIR}/start.txt

# start sshd on demand
# if [ ! -z "$SSHD_ENABLE" ]; then
#	if [ ! -z "$SSHD_NETWORK_INTERFACE" ]; then
#		# only v4  grep 'inet '
#		SSHD_BIND_IPADDR=$(ifconfig $SSHD_NETWORK_INTERFACE | grep 'inet ' |  awk '{ print $2 }')
#	else
#		SSHD_BIND_IPADDR="0.0.0.0"
#	fi
#	SSHD_PORT=${SSHD_PORT:-22}
#	/usr/sbin/sshd -p $SSHD_PORT -o ListenAddress=$SSHD_BIND_IPADDR
# fi


if [ ! -z "$KUBERNETES_SERVICE_HOST" ]; then
   echo "starting in kubernetes mode " >> /var/log/desktop/config.log
   echo "starting KUBERNETES_SERVICE_HOST is set to $KUBERNETES_SERVICE_HOST" >> /var/log/desktop/config.log
else
   echo 'KUBERNETES_SERVICE_HOST is not set, this is wrong'
   echo 'fix KUBERNETES_SERVICE_HOST=localhost as dummy value' 
   export KUBERNETES_SERVICE_HOST=localhost
fi

if  [ ! -z "$ABCDESKTOP_DEMO_ENABLE" ]; then
   sleep 530 && zenity --info --ellipsize --text="Your session will expire in few seconds" &
fi



# export VAR to running procces
export KUBERNETES_SERVICE_HOST


# set wallpaper default
# file in .store
# currentImg
# file in .config
# current_wallpaper
# if $SET_DEFAULT_WALLPAPER is defined
# first use ABCDESKTOP_LABEL_set_default_wallpaper is set
#
# echo "ABCDESKTOP_LABEL_set_default_wallpaper is $ABCDESKTOP_LABEL_set_default_wallpaper"
# echo "SET_DEFAULT_WALLPAPER=$SET_DEFAULT_WALLPAPER"
DEFAULT_WALLPAPER=${ABCDESKTOP_LABEL_set_default_wallpaper:-$SET_DEFAULT_WALLPAPER}
echo "DEFAULT_WALLPAPER=${DEFAULT_WALLPAPER}"
if [ ! -z ${DEFAULT_WALLPAPER} ]; then
        CONFIGSTORE_PATH=~/.store
        # if $SET_DEFAULT_WALLPAPER file exists
        if [ -f "$WALLPAPER_PATH/$DEFAULT_WALLPAPER" ]; then
		echo $WALLPAPER_PATH/$DEFAULT_WALLPAPER file exists
                CURRENT_WALLPAPER_FILE=~/.config/current_wallpaper
                if [ -f ${CURRENT_WALLPAPER_FILE} ]; then
			echo Reset wallpaper file to ${WALLPAPER_PATH}/${DEFAULT_WALLPAPER}
		fi
                echo "Define wallpaper as $DEFAULT_WALLPAPER to $CURRENT_WALLPAPER_FILE"
                cp "$WALLPAPER_PATH/$DEFAULT_WALLPAPER" "$CURRENT_WALLPAPER_FILE"
                echo -n ${DEFAULT_WALLPAPER} > ${CONFIGSTORE_PATH}/currentImg
        else
                echo "File $WALLPAPER_PATH/$DEFAULT_WALLPAPER does not exist skipping wallpaper"
        fi
else
        echo "SET_DEFAULT_WALLPAPER is not defined, keep default wallpapers config"
fi


# set colord default
# file in .store
# currentColor
# currentImgColor
if [ ! -z "$SET_DEFAULT_COLOR" ]; then
        CONFIGSTORE_PATH=~/.store
        # if $SET_DEFAULT_WALLPAPER file exists 
        if [ ! -f "$CONFIGSTORE_PATH"/currentColor ]; then
                echo -n "$SET_DEFAULT_COLOR" > "$CONFIGSTORE_PATH"/currentColor
        else
                echo "File $CONFIGSTORE_PATH/currentColor already exist skipping update value"
        fi
        if [ ! -f "$CONFIGSTORE_PATH/currentImgColor" ]; then
                echo -n "$SET_DEFAULT_COLOR" > "$CONFIGSTORE_PATH"/currentImgColor
        else
                echo "File $CONFIGSTORE_PATH/currentImgColor already exist skipping update value"
        fi
else
        echo "SET_DEFAULT_COLOR is not defined, keep default value"
fi

# nvidia test
if [ -d /proc/driver/nvidia ]; then
       echo /proc/driver/nvidia exists
       # suppose there is an gpu 
       if [ -x /usr/bin/nvidia-smi ]; then
	       	echo command line /usr/bin/nvidia-smi found
	        echo nvidia-smi read gpu_uuid
       		nvidia-smi --query-gpu=gpu_uuid --format=csv,noheader > /tmp/gpu_uuid
	 	cat /tmp/gpu_uuid
	fi
fi


# end of config setup 

# run dump to log
echo "KUBERNETES_SERVICE_HOST=$KUBERNETES_SERVICE_HOST" >> /var/log/desktop/config.log
echo "DISABLE_REMOTEIP_FILTERING=$DISABLE_REMOTEIP_FILTERING" >> /var/log/desktop/config.log
echo "BROADCAST_COOKIE=$BROADCAST_COOKIE" >> /var/log/desktop/config.log

# start supervisord
/usr/bin/supervisord --pidfile /var/run/desktop/supervisord.pid --nodaemon --configuration /etc/supervisord.conf
