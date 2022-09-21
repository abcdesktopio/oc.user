# defaul TAG is dev
ARG TAG=dev
# Default release is 18.04
ARG BASE_IMAGE_RELEASE=18.04
# Default base image 
ARG BASE_IMAGE=abcdesktopio/oc.software.18.04

FROM abcdesktopio/mutter:${BASE_IMAGE_RELEASE} AS mutter

# --- BEGIN node_modules_builder ---
FROM ${BASE_IMAGE}:${TAG} as node_modules_builder

COPY TARGET_MODE /TARGET_MODE
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
# use only wait-port realase 
# - 0.2.9 
# or 
# >= 1.0.1
RUN mkdir -p /composer/node/wait-port && cd /composer/node/wait-port && yarn add wait-port@1.0.1

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

WORKDIR /composer/node/spawner-service
# install node-gyp to build spawner-service
RUN yarn global add node-gyp
RUN yarn install --production=true

WORKDIR /composer/node/file-service
RUN if [ $(cat /TARGET_MODE) = docker ]; then yarn install --production=true; fi

WORKDIR /composer/node/printer-service
RUN if [ $(cat /TARGET_MODE) = docker ]; then yarn install --production=true; fi

WORKDIR /composer/node/xterm.js
RUN if [ $(cat /TARGET_MODE) != hardening ]; then yarn install --production=true; fi

# version.json must be created by mkversion.sh bash script
COPY composer/version.json /composer/version.json

# --- END node_modules_builder ---


# --- START Build image ---
FROM ${BASE_IMAGE}:${TAG}
COPY TARGET_MODE /TARGET_MODE

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

# if TARGET_MODE is hardening
# remove shell websocket xterm.js files
RUN if [ $(cat /TARGET_MODE) = hardening ]; then \
        rm -rf /composer/node/xterm.js; \
    fi


RUN if [ $(cat /TARGET_MODE) = kubernetes ] || [ $(cat /TARGET_MODE) = hardening ]; then \
	rm -rf /composer/node/printer-service \
	       /composer/node/file-service; \  
    fi

#
# themes section
# copy themes from abcdesktopio/oc.themes
COPY --from=abcdesktopio/oc.themes 	/usr/share/icons  	/usr/share/icons
COPY --from=abcdesktopio/oc.themes 	/usr/share/themes 	/usr/share/themes

#
#
#
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
RUN useradd --create-home --shell /bin/bash --uid 4096 -g $BUSER $BUSER
# create an ubuntu user
RUN echo "balloon:lmdpocpetit" | chpasswd $BUSER
# hack: be shure to own the home dir using local home volume
RUN chown -R $BUSER:$BUSER /home/$BUSER

# remove symlink in /etc/X11
# openbox -> ../xdg/openbox
# xdg does not exist
RUN rm -rf /etc/X11/openbox

COPY etc /etc

# if TARGET_MODE is not hardening
# cupsd, pulseaudo printer-service file-service are dedicated container inside the user pod
# remove supervisor files
RUN if [ $(cat /TARGET_MODE) != hardening ]; then 	\
	apt-get update && 				\
	apt-get install -y --no-install-recommends 	\
		iputils-ping 	\
		vim 		\
		telnet 		\
		qterminal && 	\
	apt-get clean; \
    fi

RUN if [ $(cat /TARGET_MODE) = hardening ]; then echo 'removing /etc/supervisor/conf.d/xterm.conf' &&  rm /etc/supervisor/conf.d/xterm.conf; fi
RUN if [ $(cat /TARGET_MODE) = kubernetes ] || [ $(cat /TARGET_MODE) = hardening ]; then \
	echo 'removing /etc/supervisor/conf.d/file-service.conf /etc/supervisor/conf.d/cupsd.conf /etc/supervisor/conf.d/printerfile-service.conf /etc/supervisor/conf.d/pulseaudio.conf /etc/supervisor/conf.d/printer-service.conf' &&  	\
	rm             /etc/supervisor/conf.d/file-service.conf /etc/supervisor/conf.d/cupsd.conf /etc/supervisor/conf.d/printerfile-service.conf /etc/supervisor/conf.d/pulseaudio.conf /etc/supervisor/conf.d/printer-service.conf;	\
    fi


# 
# create a fake ntlm_auth.desktop file
# just to hidden missing link dest
RUN touch /usr/bin/ntlm_auth.desktop

# LOG AND PID SECTION
RUN mkdir -p /var/log/desktop /var/run/desktop && \
    chown -R $BUSER:$BUSER /var/log/desktop /var/run/desktop

# Clean unecessary package
# but it's too late
RUN rm -rf /tmp/*

# set build date
RUN date > /etc/build.date
WORKDIR /home/$BUSER
# set default user
USER $BUSER

# set command
CMD [ "/composer/docker-entrypoint.sh" ]

####################################################
# SERVICE			    #   TCP PORT   #
####################################################
# XTERM_TCP_PORT 			29781
# BROADCAST_SERVICE_TCP_PORT 		29784
# SPAWNER_SERVICE_TCP_PORT 		29786
# WS_TCP_BRIDGE_SERVICE_TCP_PORT 	 6081
# DBUS_SESSION_TCP_PORT			55556
# DBUS_SYSTEM_TCP_PORT			55557
####################################################

## RESERVED TCP PORT 29782 for pulseaudio
## RESERVED TCP PORT 29785 for cupsd

EXPOSE 6081 29781 29784 29786
