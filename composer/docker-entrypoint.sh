#!/bin/bash

# Local vars
#Set Script Name variable
SCRIPT=`basename ${BASH_SOURCE[0]}`
#Initialize variables to default values.
# init.sh "  width + " " + height + " "
# Set default mode to Full HD 
OPT_LOCAL=""
WALLPAPER_PATH=~/.wallpapers


## Export Var
export LIBOVERLAY_SCROLLBAR=0
export UBUNTU_MENUPROXY=
export DISPLAY=:0
export HOME=/home/balloon
export LOGNAME=balloon
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:$HOME/.local/share/applications/bin/"
export USER=balloon
export ABCDESKTOP_RUN_DIR='/composer/run'


# export DBUS_SESSION_BUS_ADDRESS=tcp:host=localhost,bind=*,port=55556,family=ipv4

# Note that '/home/balloon/.local/share' is not in the search path
# set by the XDG_DATA_HOME and XDG_DATA_DIRS
# environment variables, so applications may not be able to find it until you set them. The directories currently searched are:
#
# - /root/.local/share
# - /usr/local/share/
# - /usr/share/




DEFAULT_VNC_PASSWD="111111"

showHelp() {
cat << EOF
Usage: $0 [-hv]
docker-entrypoint.sh script to start docker application

-h, -help,          --help                  Display help
-v, -vncpassword,   --vncpassword           Vnc Password to connect VNC server

EOF
}

options=$(getopt -l "help,vncpassword:" -o "hv:" -a -- "$@")

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
-v|--vncpassword)
    DEFAULT_VNC_PASSWD=$2
    shift 2;
    ;;
esac
done


# First start
# Clean lock 
rm -rf /tmp/.X0-lock
chown balloon:balloon /home/balloon

mkdir -p ${ABCDESKTOP_RUN_DIR}/.vnc
echo "${DEFAULT_VNC_PASSWD}" | vncpasswd -f > ${ABCDESKTOP_RUN_DIR}/.vnc/passwd


# Create a lot of directories and files in homedir 
# 
if [ ! -d ~/.cache ]; then
	echo "create ~/.cache directory"
        mkdir ~/.cache
fi

if [ ! -f ~/.Xauthority ]; then
	echo "touch ~/.Xauthority file"
	touch ~/.Xauthority
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
	mkdir ~/.store
fi

if [ ! -d ~/Desktop ]; then
	echo "create ~/Desktop directory"
        mkdir ~/Desktop
fi

if [ ! -d ~/.config ]; then
	echo "create  ~/.config  directory"
        mkdir -p ~/.config
        cp -r /composer/.config ~/.config
fi

if [ ! -d ~/.config/autostart ]; then
	echo "create  ~/.config/autostart directory"
        mkdir -p ~/.config/autostart
fi

if [ ! -d ~/.config/gtk-3.0 ]; then
	echo "create  ~/.config/gtk-3.0 directory"
        mkdir -p ~/.config/gtk-3.0
        cp -r /composer/.config/gtk-3.0 ~/.config/gtk-3.0
fi

if [ ! -f ~/.config/gtk-3.0/settings.ini ]; then
	echo "copy ~/.config/gtk-3.0/settings.ini file"
        cp /composer/.config/gtk-3.0/settings.ini ~/.config/gtk-3.0
fi

if [ ! -d ~/.config/nautilus ]; then
	echo "create ~/.config/nautilus directory"
        mkdir -p ~/.config/nautilus
fi

if [ ! -d ~/.themes ]; then
	echo "create ~/.themes directory"
	cp -rp /composer/.themes ~
fi

if [ ! -f ~/.gtkrc-2.0 ]; then
	echo "create ~/.gtkrc-2.0 file"
	cp -rp /composer/.gtkrc-2.0 ~
fi 

if [ ! -f ~/.xsettings ]; then
	cp -rp /composer/.xsettings ~
fi

if [ ! -d ~/.gconf ]; then
        cp -rp /composer/.gconf ~
fi

if [ ! -d ~/.gconf/apps ]; then
        cp -rp /composer/.gconf/apps ~/.gconf
        chmod -R 700 ~/.gconf/apps
fi

if [ ! -f ~/.Xressources ];  then
	cp -p /composer/.Xressources ~ 
fi

if [ ! -f ~/.bashrc ];  then
	# we can't run a link if home dir is configured as a dedicated volume
        cp -r /composer/.bashrc ~
fi

if [ ! -d ~/.wallpapers ]; then
  	# add default wallpapers 
  	# we can't run a link if home dir is configured as a dedicated volume
  	mkdir ~/.wallpapers
  	cp -rp /composer/wallpapers/* ~/.wallpapers
fi

if [ ! -f ~/.config/user-dirs.dirs ]; then
  	xdg-user-dirs-update &
fi 


mkdir -p ~/.local/share
mkdir -p ~/.local/share/applications           
mkdir -p ~/.local/share/applications/bin

if [ ! -d ~/.local/share/icons ]; then
  	cp -rp /composer/icons ~/.local/share
fi

if [ ! -d ~/.local/share/mime ]; then
  	cp -rp /composer/mime ~/.local/share
  	update-mime-database ~/.local/share/mime > /var/log/desktop/update-mime-database.log &
fi

# before starting pulseaudio
# check if the owner of $HOME belongs to $USER
# pulseaudio may failed if the owner is not the owner of his dir
if [ -f /composer/checkhomeowner.sh ]; then
  echo "Processing /composer/checkhomeowner.sh file...";
  source /composer/checkhomeowner.sh
fi 

## DBUS Section
# source https://georgik.rocks/how-to-start-d-bus-in-docker-container/
# source https://stackoverflow.com/questions/10158684/connecting-to-dbus-over-tcp
if [ ! -f /var/lib/dbus/machine-id ]; then
  echo 'starting dbus-uuidgen > /var/lib/dbus/machine-id' >> /var/log/desktop/dbus.log
  dbus-uuidgen > /var/lib/dbus/machine-id
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


# add file date data
echo `date` > ${ABCDESKTOP_RUN_DIR}/start.txt

# Read first ip add
CONTAINER_IP_ADDR=$(hostname -i)
echo "Container local ip addr is $CONTAINER_IP_ADDR"
export CONTAINER_IP_ADDR

# update pulseaudio conf
if [ -f /etc/pulse/default.pa ]; then
	# replace CONTAINER_IP_ADDR in listen for pulseaudio
	# NEVER listening to 127.0.0.1:x for ws hack security 
	sed -i "s/module-http-protocol-tcp/module-http-protocol-tcp listen=$CONTAINER_IP_ADDR/g" /etc/pulse/default.pa 
fi 

 
# update cupds conf
if [ -f /etc/cups/cupsd.conf  ]; then
	# replace CONTAINER_IP_ADDR in listen for cupsd
	# NEVER listening to 127.0.0.1:x for ws hack security 
	sed -i "s/localhost:631/$CONTAINER_IP_ADDR:631/g" /etc/cups/cupsd.conf 
fi

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

# export VAR to running procces
export KUBERNETES_SERVICE_HOST

if [ -z "$DISABLE_REMOTEIP_FILTERING" ]; then
        DISABLE_REMOTEIP_FILTERING=disabled
fi  
if [ "$DISABLE_REMOTEIP_FILTERING"=="enabled" ]; then
	echo "DISABLE_REMOTEIP_FILTERING=$DISABLE_REMOTEIP_FILTERING" >> /var/log/desktop/config.log
else
	DISABLE_REMOTEIP_FILTERING=disabled
fi
export DISABLE_REMOTEIP_FILTERING

# set wallpaper default
# file in .store
# currentImg
# file in .config
# current_wallpaper
# if $SET_DEFAULT_WALLPAPER is defined
if [ ! -z "$SET_DEFAULT_WALLPAPER" ]; then
        CONFIGSTORE_PATH = "~/.store"
        # if $SET_DEFAULT_WALLPAPER file exists
        if [ -f "$WALLPAPER_PATH/$SET_DEFAULT_WALLPAPER" ]; then
                CURRENT_WALLPAPER_FILE = "~/.config/current_wallpaper"
                # if a wall_paper as not already been set
                if [ ! -f "$CURRENT_WALLPAPER_FILE" ]; then
                        # if .config/current_wallpaper does not exist
                        echo "Define wallpaper as $SET_DEFAULT_WALLPAPER to $CURRENT_WALLPAPER_FILE"
                        cp "$WALLPAPER_PATH/$SET_DEFAULT_WALLPAPER" "$CURRENT_WALLPAPER_FILE"
                        echo "$SET_DEFAULT_WALLPAPER" > "$CONFIGSTORE_PATH"/currentImg
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
        CONFIGSTORE_PATH = "~/.store"
        # if $SET_DEFAULT_WALLPAPER file exists 
        if [ ! -f "$CONFIGSTORE_PATH"/currentColor ]; then
                echo "$SET_DEFAULT_COLOR" > "$CONFIGSTORE_PATH"/currentColor
        else
                echo "File $CONFIGSTORE_PATH/currentColor already exist skipping update value"
        fi
        if [ ! -f "$CONFIGSTORE_PATH/currentImgColor" ]; then
                echo "$SET_DEFAULT_COLOR" > "$CONFIGSTORE_PATH"/currentImgColor
        else
                echo "File $CONFIGSTORE_PATH/currentImgColor already exist skipping update value"
        fi
else
        echo "SET_DEFAULT_COLOR is not defined, keep default value"
fi

# end of config setup 




# start supervisord
/usr/bin/supervisord --pidfile /var/run/desktop/supervisord.pid --nodaemon --configuration /etc/supervisord.conf
