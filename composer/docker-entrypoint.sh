#!/bin/bash

# Local vars
#Set Script Name variable
SCRIPT=`basename ${BASH_SOURCE[0]}`
#Initialize variables to default values.
# init.sh "  width + " " + height + " "
# Set default mode to Full HD 
OPT_LOCAL=""
WALLPAPER_PATH=~/.wallpapers
# ABCDESKTOP_SESSION is a random value 
# unique for each desktop
((ABCDESKTOP_SESSION=((RANDOM<<15|RANDOM)<<15|RANDOM)<<15|RANDOM))

## Export Var
export LIBOVERLAY_SCROLLBAR=0
export UBUNTU_MENUPROXY=0
export DISPLAY=${DISPLAY:-':0.0'}
export X11LISTEN=${X11LISTEN:-'udp'}
export USER=${USER:-'balloon'}
export UID=${UID:-4096}
export GID=${GID:-4096}
export HOME=${HOME:-'/home/balloon'}
export LOGNAME=${LOGNAME:-'balloon'}
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:$HOME/.local/share/applications/bin/"
export ABCDESKTOP_RUN_DIR=${ABCDESKTOP_RUN_DIR:-'/var/run/desktop'}
export ABCDESKTOP_LOG_DIR=${ABCDESKTOP_LOG_DIR:-'/var/log/desktop'}
export DISABLE_REMOTEIP_FILTERING=${DISABLE_REMOTEIP_FILTERING:-'disabled'}
export BROADCAST_COOKIE=${BROADCAST_COOKIE:-$ABCDESKTOP_SESSION}

# Read Label Var
# ABCDESKTOP_LABEL_sendcuttext    - Send clipboard changes to clients.
# ABCDESKTOP_LABEL_acceptcuttext  - Accept clipboard updates from clients.
# kubernetes pod's label var override default value
export SENDCUTTEXT=${ABCDESKTOP_LABEL_sendcuttext:-$SENDCUTTEXT}
export ACCEPTCUTTEXT=${ABCDESKTOP_LABEL_acceptcuttext:-$ACCEPTCUTTEXT}


# Read first $POD_IP if not set get from hostname -i ip addr
CONTAINER_IP_ADDR=${POD_IP:-$(hostname -i)}
echo "Container local ip addr is $CONTAINER_IP_ADDR"
export CONTAINER_IP_ADDR

# 
# export DBUS_SESSION_BUS_ADDRESS=tcp:host=localhost,bind=*,port=55556,family=ipv4

# Note that '/home/balloon/.local/share' is not in the search path
# set by the XDG_DATA_HOME and XDG_DATA_DIRS
# environment variables, so applications may not be able to find it until you set them. The directories currently searched are:
#
# - /root/.local/share
# - /usr/local/share/
# - /usr/share/


showHelp() {
cat << EOF
Usage: $0 [-hv]
docker-entrypoint.sh script to start docker application

-h, -help,          --help                  Display help

EOF
}

options=$(getopt -l "help:" -o "h:" -a -- "$@")

# set --:
# If no arguments follow this option, then the positional parameters are unset. Otherwise, the positional parameters
# are set to the arguments, even if some of them begin with a ‘-’.
eval set -- "$options"

while [[ $1 != -- ]]; do
case $1 in
-h|--help)
    showHelp
    exit 0
    ;;
esac
done


# First start
# Clean lock 
rm -rf /tmp/.X0-lock

# get VNC_PASSWORD 
# use vncpasswd command line to create passwd file
mkdir -p ${ABCDESKTOP_RUN_DIR}/.vnc
# read the vnc password from the kubernetes secret
if [ -f /var/secrets/abcdesktop/vnc/password ]; then
        echo 'vnc password use kubernetes secret'
	cat /var/secrets/abcdesktop/vnc/password | vncpasswd -f > ${ABCDESKTOP_RUN_DIR}/.vnc/passwd
else
	# no kubernetes secret has been define
	# use VNC_PASSWORD and VNC_KEY
        # VNC_KEY is a symetric key
	# VNC_PASSWORD is the crypto
	if [ ! -z "$VNC_PASSWORD" ]; then
		# add missing = in b32 encoded password
		B32VNC_PASSWORD=$(echo -n "$VNC_PASSWORD" |/composer/safe_b32.sh)
		# echo -n "$B32VNC_PASSWORD | base32 -d | openssl aes-256-cbc -pbkdf2 -d -k "$VNC_KEY" | vncpasswd -f > ${ABCDESKTOP_RUN_DIR}/.vnc/passwd
		echo -n $VNC_PASSWORD | vncpasswd -f > ${ABCDESKTOP_RUN_DIR}/.vnc/passwd
	else
		echo 'error not vnc password has been set, the var VNC_PASSWORD is empty or unset'
	fi
fi


# Create a lot of directories and files in homedir 
# 
if [ ! -L ~/.cache ]; then
	echo "~/.cache is not a link"
        rm -rf ~/.cache
	mkdir -p /var/run/desktop/.cache
	ln -s ~/.cache /var/run/desktop/.cache
fi


# create a MIT-MAGIC-COOKIE-1 entry in .Xauthority
if [ ! -z "$XAUTH_KEY" ]; then
	# remove previous file
	# add * prevent lock file
	echo "remove ~/.Xauthority file"
	rm -rf ~/.Xauthority*
	echo "create ~/.Xauthority file"
	touch  ~/.Xauthority
	xauth add :0 MIT-MAGIC-COOKIE-1 $XAUTH_KEY
fi

if [ -z "$KUBERNETES_SERVICE_HOST" ]; then
	echo "not a KUBERNETES_SERVICE_HOST node"
	echo "create ~/.printer-queue directory"
	if [ ! -d ~/.printer-queue ]; then
		mkdir ~/.printer-queue
	fi
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
	cat /etc/pulse/cookie | openssl rc4 -K "$PULSEAUDIO_COOKIE" -nopad -nosalt > ~/.config/pulse/cookie
fi

if [ ! -d ~/.config/autostart ]; then
	echo "create  ~/.config/autostart directory"
        mkdir -p ~/.config/autostart
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

if [ ! -f ~/.xsettingsd ]; then
	cp -rp /composer/.xsettingsd ~
fi

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
  	mkdir ~/.wallpapers
  	cp -rp /composer/wallpapers/* ~/.wallpapers &
	cp_pid=$!
	echo "TESTING_MODE=$TESTING_MODE"
	# check if we are running self test 
	# if we are in testing mode wait for cp command finnish
	# self test start too quickly
	# without wait state
	# files in ~/.wallpapers must exist  
	if [ ! -z "$TESTING_MODE" ]; then
		echo "We are in testing mode, waiting for cp command complete"
		wait $cp_pid
		echo "~/.wallpapers dump"
		ls -la ~/.wallpapers
	fi
fi

if [ ! -f ~/.config/user-dirs.dirs ]; then
	echo "run xdg-user-dirs-update"
	xdg-user-dirs-update --force
	export $(grep -v '^#' user-dirs.dirs | xargs -0)

	xdg-user-dirs-update &
fi 

# create .local entries
mkdir -p ~/.local/share/icons   
mkdir -p ~/.local/share/mime
mkdir -p ~/.local/share/applications/bin

if [ ! -d ~/.local/share/icons ]; then
  	cp -rp /composer/icons ~/.local/share &
fi

# if [ ! -d ~/.local/share/mime ]; then
  	# cp -rp /composer/mime ~/.local/share
  	# update-mime-database ~/.local/share/mime > /var/log/desktop/update-mime-database.log &
# fi

# before starting pulseaudio
# check if the owner of $HOME belongs to $USER
# pulseaudio crash if the home does not belong to user
if [ -f /composer/checkhomeowner.sh ]; then
  echo "Processing /composer/checkhomeowner.sh file...";
  source /composer/checkhomeowner.sh
fi 

## DBUS Section
# source https://georgik.rocks/how-to-start-d-bus-in-docker-container/
# source https://stackoverflow.com/questions/10158684/connecting-to-dbus-over-tcp
if [ ! -f /var/lib/dbus/machine-id ]; then
  echo 'starting dbus-uuidgen > /var/lib/dbus/machine-id' >> /var/log/desktop/dbus.log
  dbus-uuidgen > /var/lib/dbus/machine-id &
fi

if [ ! -d /var/run/dbus ]; then 
	mkdir -p /var/run/dbus
fi

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



# Check if need to start dbus session
if [ ! -z "$OD_DBUS_SESSION_BUS" ]; then
   echo "starting OD_DBUS_SESSION_BUS is set $OD_DBUS_SESSION_BUS" >> /var/log/desktop/dbus.log
   dbus_session=$(dbus-daemon --config-file=/usr/share/dbus-1/session.conf --print-address --fork --nosyslog)
   if [ $? -eq 0 ]; then
   	echo "export DBUS_SESSION_BUS_ADDRESS=$dbus_session" > ~/.DBUS_SESSION_BUS
	chmod 755  ~/.DBUS_SESSION_BUS
        echo "DBUS_SESSION is set $dbus_session" >> /var/log/desktop/dbus.log
   else
	[ -f ~/.DBUS_SESSION_BUS ] && rm ~/.DBUS_SESSION_BUS
   fi
fi 

# Check if need to start dbus system
if [ ! -z "$OD_DBUS_SYSTEM_BUS" ]; then
   echo "starting OD_DBUS_SYSTEM_BUS is set $OD_DBUS_SYSTEM_BUS" >> /var/log/desktop/dbus.log
   dbus_system=$(dbus-daemon --config-file=/usr/share/dbus-1/system.conf --print-address  --fork --nosyslog ) 
   if [ $? -eq 0 ]; then
   	echo "export DBUS_SYSTEM_BUS_ADDRESS=$dbus_system" > ~/.DBUS_SYSTEM_BUS
	chmod 755 ~/.DBUS_SYSTEM_BUS
	echo "DBUS_SYSTEM is set $dbus_system" >> /var/log/desktop/dbus.log
   else
	[ -f ~/.DBUS_SYSTEM_BUS ] && rm ~/.DBUS_SYSTEM_BUS
   fi
fi

# dbus-daemon --config-file=/usr/share/dbus-1/system.conf --print-address


## KERBEROS SECTION
if [ -f /var/secrets/abcdesktop/kerberos/keytab ]; then
	export KRB5_CLIENT_KTNAME=/var/secrets/abcdesktop/kerberos/keytab
fi

if [ -f /var/secrets/abcdesktop/kerberos/krb5.conf ]; then
        export KRB5_CONFIG=/var/secrets/abcdesktop/kerberos/krb5.conf
fi

if [ -f /var/secrets/abcdesktop/kerberos/PRINCIPAL ]; then
	export USERPRINCIPALNAME=$(cat /var/secrets/abcdesktop/kerberos/PRINCIPAL)
fi

if [ -f /var/secrets/abcdesktop/kerberos/REALM ]; then
        export REALM=$(cat /var/secrets/abcdesktop/kerberos/REALM)
fi

# Now run kinit if all vars are set 
if [ ! -z "$USERPRINCIPALNAME" ] && [ ! -z "$REALM" ] && [ ! -z "$KRB5_CONFIG" ] && [ ! -z "$KRB5_CLIENT_KTNAME" ]; then
	kinit "$USERPRINCIPALNAME@$REALM" -k -t $KRB5_CLIENT_KTNAME &
fi 

## END OF KERBEROS


# add file start info timedate data
echo `date` > ${ABCDESKTOP_RUN_DIR}/start.txt

# update pulseaudio conf
# if [ -f /etc/pulse/default.pa ]; then
#	# replace CONTAINER_IP_ADDR in listen for pulseaudio
#	# NEVER listening to 127.0.0.1:x for ws hack security 
#	sed -i "s/module-http-protocol-tcp/module-http-protocol-tcp listen=$CONTAINER_IP_ADDR/g" /etc/pulse/default.pa 
# fi 

 
# update cupds conf
# if [ -f /etc/cups/cupsd.conf  ]; then
#         # replace CONTAINER_IP_ADDR in listen for cupsd
# 	# NEVER listening to 127.0.0.1:x for ws hack security 
# 	sed -i "s/localhost:631/$CONTAINER_IP_ADDR:631/g" /etc/cups/cupsd.conf 
# fi

# # start sshd on demand
# if [ ! -z "$SSHD_ENABLE" ]; then
# 	if [ ! -z "$SSHD_NETWORK_INTERFACE" ]; then
# 		# only v4  grep 'inet '
# 		SSHD_BIND_IPADDR=$(ifconfig $SSHD_NETWORK_INTERFACE | grep 'inet ' |  awk '{ print $2 }')
# 	else
# 		SSHD_BIND_IPADDR="0.0.0.0"
# 	fi
# 	SSHD_PORT=${SSHD_PORT:-22}
# 	/usr/sbin/sshd -p $SSHD_PORT -o ListenAddress=$SSHD_BIND_IPADDR
# fi


if [ ! -z "$KUBERNETES_SERVICE_HOST" ]; then
   echo "starting in kubernetes mode " >> /var/log/desktop/config.log
   echo "starting KUBERNETES_SERVICE_HOST is set to $KUBERNETES_SERVICE_HOST" >> /var/log/desktop/config.log
else
   echo "starting in docker mode" >> /var/log/desktop/config.log
   # KUBERNETES_SERVICE_HOST must exist 
   # else supervisord return an error  
   KUBERNETES_SERVICE_HOST=''
   # Add NGINX_SERVICE_HOST ip addr
   NGINX_SERVICE_HOST=$(getent hosts nginx | awk '{ print $1 }')
   export NGINX_SERVICE_HOST
   echo "NGINX_SERVICE_HOST=$NGINX_SERVICE_HOST" >> /var/log/desktop/config.log
   echo "starting /composer/post-docker-entrypoint.sh in background" >> /var/log/desktop/config.log
   /composer/post-docker-entrypoint.sh &
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
if [ ! -z "$SET_DEFAULT_WALLPAPER" ]; then
        CONFIGSTORE_PATH=~/.store
        # if $SET_DEFAULT_WALLPAPER file exists
        if [ -f "$WALLPAPER_PATH/$SET_DEFAULT_WALLPAPER" ]; then
                CURRENT_WALLPAPER_FILE=~/.config/current_wallpaper
                # if a wall_paper as not already been set
                if [ ! -f "$CURRENT_WALLPAPER_FILE" ]; then
                        # if .config/current_wallpaper does not exist
                        echo "Define wallpaper as $SET_DEFAULT_WALLPAPER to $CURRENT_WALLPAPER_FILE"
                        cp "$WALLPAPER_PATH/$SET_DEFAULT_WALLPAPER" "$CURRENT_WALLPAPER_FILE"
                        echo -n "$SET_DEFAULT_WALLPAPER" > "$CONFIGSTORE_PATH"/currentImg
                else
                        echo "$CURRENT_WALLPAPER_FILE exists skipping value $SET_DEFAULT_WALLPAPER"
                fi
        else
                        echo "File $WALLPAPER_PATH/$SET_DEFAULT_WALLPAPER does not exist skipping wallpaper"
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

# end of config setup 

# run dump to log
echo "KUBERNETES_SERVICE_HOST=$KUBERNETES_SERVICE_HOST" >> /var/log/desktop/config.log
echo "DISABLE_REMOTEIP_FILTERING=$DISABLE_REMOTEIP_FILTERING" >> /var/log/desktop/config.log
echo "BROADCAST_COOKIE=$BROADCAST_COOKIE" >> /var/log/desktop/config.log

# start supervisord
/usr/bin/supervisord --pidfile /var/run/desktop/supervisord.pid --nodaemon --configuration /etc/supervisord.conf
