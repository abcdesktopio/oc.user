# defaul TAG is dev
ARG TAG=dev
# Default release is 18.04
ARG BASE_IMAGE_RELEASE=18.04
# Default base image 
ARG BASE_IMAGE=abcdesktopio/oc.software.18.04


FROM abcdesktopio/mutter:${BASE_IMAGE_RELEASE} AS mutter

# --- BEGIN node_modules_builder ---
FROM ${BASE_IMAGE}:${TAG} as node_modules_builder

RUN cat /etc/lsb-release
# 
#  Add dev package to node install
## You may also need development tools to build native addons:
##     sudo apt-get install gcc g++ make
RUN apt-get update && apt-get install -y  --no-install-recommends      \
	gcc                             \
	g++                             \
	make    			\
    && apt-get clean                    \
    && rm -rf /var/lib/apt/lists/*

# to make install wmctrljs nodejs components
# add build dev package 
RUN apt-get update && apt-get install -y  --no-install-recommends \
	libx11-dev \
	libxmu-dev \
	git	   \
	dpkg       \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY composer /composer

# add wait-port
RUN mkdir -p /composer/node/wait-port && cd /composer/node/wait-port && yarn add wait-port

# Add nodejs service
# yarn install --production[=true|false]
# yarn will not install any package listed in devDependencies if the NODE_ENV environment variable is set to production. 
# Use this flag to instruct Yarn to ignore NODE_ENV and take its production-or-not status from this flag instead.
WORKDIR /composer/node/common-libraries
RUN   yarn install --production=true

WORKDIR /composer/node/broadcast-service
RUN yarn install --production=true

WORKDIR /composer/node/ocrun
RUN yarn install --production=true

WORKDIR /composer/node/ocdownload
RUN yarn install --production=true

WORKDIR /composer/node/occall
RUN yarn install --production=true

WORKDIR /composer/node/file-service
RUN yarn install --production=true

WORKDIR /composer/node/printer-service
RUN yarn install --production=true

WORKDIR /composer/node/spawner-service
# install node-gyp to build spawner-service
RUN yarn global add node-gyp
RUN yarn install --production=true

# WORKDIR /composer/node/lync 
# RUN yarn install

WORKDIR /composer/node/xterm.js
RUN yarn install --production=true

# version.json must be created by mkversion.sh nbash script
COPY composer/version.json /composer/version.json

# --- END node_modules_builder ---


# --- START Build image ---
FROM ${BASE_IMAGE}:${TAG}
COPY TARGET_MODE /TARGET_MODE

# if TARGET_MODE is docker
# no pod is ready to provide
# sound and printer
# add sound and printer service
# cups-pdf: pdf printer support
# scrot: screenshot tools
# smbclient need to install smb printer
# cups: printer support
# add pulseaudio server
RUN if [ $(cat /TARGET_MODE) = docker ]; then \
	apt-get update && apt-get install -y --no-install-recommends \
		pulseaudio 	\
        	smbclient	\
		cups-pdf 	\
		scrot  		\
        	cups		\
    	&& apt-get clean && rm -rf /var/lib/apt/lists/*; fi

# if TARGET_MODE is kubernetes
# cupsd, pulseaudo printer-service file-service are dedicated container inside the user pod
# remove supervisor files
RUN if [ $(cat /TARGET_MODE) = kubernetes ]; then \
	rm -rf 	/etc/supervisor/conf.d/pulseaudio.conf \
		/etc/supervisor/conf.d/printer-service.conf \
		/etc/supervisor/conf.d/file-service.conf \
		/etc/supervisor/conf.d/cupsd.conf;\
    fi

# splitted for debug
# update replace by default websockify package
# add websockify as ws to tcp proxy 
RUN apt-get update && apt-get install -y  \
        python3-pip                     \
        python3-wheel                   \
        python3-setuptools              \
	python3-pkg-resources		\
	gfortran			&& \
    pip3 install 'Cython>=0.29.21'	&& \
    pip3 install 'websockify>=0.9.0' 	&& \
    apt-get remove -y 		\
    	python3-pip 		\
	python3-wheel 		\
	python3-setuptools 	\
    && apt autoremove -y        \
    && apt-get clean                    \
    && rm -rf /var/lib/apt/lists/*


COPY --from=node_modules_builder 	/composer  		/composer

#
# themes section
# copy themes from abcdesktopio/oc.themes
COPY --from=abcdesktopio/oc.themes 	/usr/share/icons  	/usr/share/icons
COPY --from=abcdesktopio/oc.themes 	/usr/share/themes 	/usr/share/themes
RUN apt-get update && apt-get install -y --no-install-recommends \
	adwaita-icon-theme-full 	\
	gnome-themes-standard		\
	gnome-themes-extra		\
    && apt autoremove -y        	\
    && apt-get clean                    \
    && rm -rf /var/lib/apt/lists/*

#
# Note: this is a workaround
#
# there is a bug with (openbox or Xvnc) and noVNC, the cursor size is always bigger
# -> change in file .Xresources and set Xcursor.size: 24 does not work
# -> can't find a cursor theme with default size
RUN rm -rf 	/usr/share/icons/Adwaita/cursors \
		/usr/share/icons/Adwaita/cursor.theme \
		/usr/share/icons/McMojave-cursors
# end of themes section




# Add 
RUN adduser root lpadmin 

# Next command use $BUSER context
ENV BUSER balloon
# RUN adduser --disabled-password --gecos '' $BUSER
# RUN id -u $BUSER &>/dev/null || 
RUN groupadd --gid 4096 $BUSER
RUN useradd --create-home --shell /bin/bash --uid 4096 -g $BUSER --groups lpadmin,sudo $BUSER
# create an ubuntu user
RUN echo "balloon:lmdpocpetit" | chpasswd $BUSER

# hack: be shure to own the home dir 
RUN chown -R $BUSER:$BUSER /home/$BUSER

# remove symlink in /etc/X11
# openbox -> ../xdg/openbox
# xdg does not exist
RUN rm -rf /etc/X11/openbox

COPY etc /etc

RUN chown -R $BUSER:$BUSER /etc/pulse && \
    chown -R $BUSER:$BUSER /etc/cups

RUN date > /etc/build.date


# if TARGET_MODE is docker
# Add here commands need to run as sudo user
# cupsd must be run as root
# changehomeowner  
RUN if [ $(cat /TARGET_MODE) = docker ]; then \
	echo "$BUSER ALL=(root) NOPASSWD: /usr/sbin/cupsd" >> /etc/sudoers.d/cupsd  && \
	echo "$BUSER ALL=(root) NOPASSWD: /composer/changehomeowner.sh" >> /etc/sudoers.d/changehomeowner; \
    fi

# if TARGET_MODE is kubernetes
# kubernetes use a -n init container command, 
# no need the bash script /composer/changehomeowner.sh
RUN if [ $(cat /TARGET_MODE) = kubernetes ]; then \
	rm /composer/changehomeowner.sh; \
    fi


# 
# create a fake ntlm_auth.desktop file
# just to hidden missing link dest
RUN touch /usr/bin/ntlm_auth.desktop

# LOG AND PID SECTION
RUN mkdir -p 	/var/log/desktop \ 
        	/var/run/desktop \
        	/composer/run	 \
		/container/.cache 	 

# XDG
RUN mkdir -p  	/run/user/4096	&& \
    chown $BUSER:$BUSER /run/user/4096 && \
    chmod 700 /run/user/4096 
    

## DBUS SECTION
RUN mkdir -p    /var/run/dbus      
RUN touch /var/lib/dbus/machine-id
RUN chown -R $BUSER:$BUSER 				\
		/var/run/dbus    			\
		/var/lib/dbus				\
		/var/lib/dbus/machine-id  
		
# DO NOT CHANGE
# COPY usr/share/dbus-1/session.conf /usr/share/dbus-1/session.conf
# COPY usr/share/dbus-1/system.conf  /usr/share/dbus-1/system.conf


# change access rights
RUN chown -R $BUSER:$BUSER 				\
	/container					\
	/container/.cache                               \  
	/etc/X11/openbox				\
	/var/log/desktop				\
	/var/run/desktop				\
	/composer/run					\
	/composer/mime					\
	/composer/icons					\
	/composer/.gtkrc-2.0				\
	/composer/.xsettingsd				\
	/composer/.gconf				\
	/composer/.Xresources

# install the abcdesktop openbox package
# COPY --from=mutter *.deb  /tmp/
# WORKDIR /tmp
#RUN apt-get update && \
#    apt-get install -y --no-install-recommends  \
#	mutter				&& \
#    apt-get install -y --no-install-recommends ./mutter-common*.deb          && \
#    apt-get install -y --no-install-recommends ./libmutter-?-0*.deb          && \
#    apt-get install -y --no-install-recommends ./gir1.2-mutter-*.deb         && \
#    apt-get install -y --no-install-recommends ./mutter_3.*.deb        	&& \   
#    rm -rf /tmp/*.deb			&& \
#    apt-get clean  			&& \
#    rm -rf /var/lib/apt/lists/*

# RUN apt-get update && \
#    apt-get install -y --no-install-recommends  \
#	libglib2.0-bin				\
#    && \
#    apt-get clean                       && \
#    rm -rf /var/lib/apt/lists/*

# Clean unecessary package
# but it's too late
RUN rm -rf /tmp/*

# VOLUME /home/$BUSER
WORKDIR /home/$BUSER
USER $BUSER
CMD [ "/composer/docker-entrypoint.sh" ]

####################################################
# SERVICE			    #   TCP PORT   #
####################################################
# FILEMANAGER_BRIDGE_TCP_PORT 		29780
# XTERM_TCP_PORT 			29781
# PULSEAUDIO_HTTP_PORT 			4714
# FILE_SERVICE_TCP_PORT 		29783
# BROADCAST_SERVICE_TCP_PORT 		29784
# RESERVED FOR CUPSD 			29785
# SPAWNER_SERVICE_TCP_PORT 		29786
# WS_TCP_BRIDGE_SERVICE_TCP_PORT 	 6081
# DBUS_SESSION_TCP_PORT			55556
# DBUS_SYSTEM_TCP_PORT			55557
####################################################

## RESERVED TCP PORT 29782 for pulseaudio
## RESERVED TCP PORT 29785 for cupsd

EXPOSE 4714 6081 29780 29781 29783 29784 29786 55556 55557
