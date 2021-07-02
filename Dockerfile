# defaul TAG is dev
ARG TAG=dev
# Default release is 18.04
ARG BASE_IMAGE_RELEASE=18.04
# Default base image 
ARG BASE_IMAGE=abcdesktopio/oc.software.18.04

# --- BEGIN node_modules_builder ---
FROM $BASE_IMAGE:$TAG as node_modules_builder

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
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

#Install yarn
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update && apt-get install -y --no-install-recommends \
	yarn \
    && apt-get clean                    \
    && rm -rf /var/lib/apt/lists/*

COPY composer /composer

# add wait-port
RUN mkdir -p /composer/node/wait-port && cd /composer/node/wait-port && yarn add wait-port

# Add nodejs service
WORKDIR /composer/node/common-libraries
RUN   yarn install

# replace by websockify
# WORKDIR /composer/node/ws-tcp-bridge
# RUN yarn install	

WORKDIR /composer/node/broadcast-service
RUN yarn install 

WORKDIR /composer/node/ocrun
RUN yarn install 

WORKDIR /composer/node/ocdownload
RUN yarn install

WORKDIR /composer/node/occall
RUN yarn install

WORKDIR /composer/node/file-service
RUN yarn install 

WORKDIR /composer/node/printer-service
RUN yarn install

WORKDIR /composer/node/spawner-service
RUN yarn install 

WORKDIR /composer/node/lync 
RUN yarn install

WORKDIR /composer/node/xterm.js
RUN yarn install

COPY Makefile /
COPY mkversion.sh /
COPY .git /

WORKDIR /
RUN make version

# --- END node_modules_builder ---


# --- START Build image ---
FROM $BASE_IMAGE:$TAG


# cups-pdf: pdf printer support
# scrot: screenshot tools
# smbclient need to install smb printer
# cups: printer support
RUN  apt-get update && apt-get install -y --no-install-recommends \
        smbclient	\
	cups-pdf 	\
	scrot  		\
        cups		\
    && apt-get clean	\
    && rm -rf /var/lib/apt/lists/*
    
# add pulseaudio server
RUN apt-get update && apt-get install -y --no-install-recommends\
	pulseaudio 			\
    && apt-get clean  			\
    && rm -rf /var/lib/apt/lists/*


# add websockify as ws to tcp proxy 
RUN apt-get update && apt-get install -y --no-install-recommends \
	python3-pip			\
    && apt-get clean                    \
    && rm -rf /var/lib/apt/lists/*	\
    && pip3 install websockify


#Install yarn
# yarn is use for the test mode 
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update && apt-get install -y --no-install-recommends \ 
	yarn	\ 
    && apt-get clean                    \
    && rm -rf /var/lib/apt/lists/*

COPY --from=node_modules_builder /composer  /composer


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

COPY etc /etc
RUN chown -R $BUSER:$BUSER /etc/pulse && \
    chown -R $BUSER:$BUSER /etc/cups

RUN date > /etc/build.date

# Add here commands need to run as sudo user
# cupsd must be run as root
# changehomeowner 
RUN echo "$BUSER ALL=(root) NOPASSWD: /usr/sbin/cupsd" >> /etc/sudoers.d/cupsd
RUN echo "$BUSER ALL=(root) NOPASSWD: /composer/changehomeowner.sh" >> /etc/sudoers.d/changehomeowner

# create use default directory
# RUN mkdir -p /home/$BUSER/.local/share/applications 	&& \
#    mkdir -p /home/$BUSER/.local/share/applications/bin && \
#    mkdir -p /home/$BUSER/.local/share/Trash/		&& \
#    mkdir -p /home/$BUSER/Desktop			&& \
#    mkdir -p /home/$BUSER/.config			&& \
#    mkdir -p /home/$BUSER/.config/qterminal.org

# 
# create a fake ntlm_auth.desktop file
# just to hidden missing link dest
RUN touch /usr/bin/ntlm_auth.desktop

# no need to run twice 
# RUN cp -p /composer/wallpapers/* /home/$BUSER/.wallpapers   
# RUN cp -rp /composer/mime /home/$BUSER/.local/share
# RUN cp -rp /composer/icons /home/$BUSER/.local/share
# RUN update-mime-database /home/$BUSER/.local/share/mime


# LOG AND PID SECTION
RUN mkdir -p 	/var/log/desktop \ 
        	/var/run/desktop \
        	/composer/run

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
	/etc/X11/openbox				\
	/var/log/desktop				\
	/var/run/desktop				\
	/composer/run					\
	/composer/mime					\
	/composer/icons					\
	/composer/.themes				\
	/composer/.gtkrc-2.0				\
	/composer/.xsettings				\
	/composer/.gconf				\
	/composer/.Xressources				\
	/composer/.bashrc				\
	/composer/.cache				

# Clean unecessary package
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

