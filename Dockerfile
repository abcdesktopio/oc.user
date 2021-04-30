ARG TAG=dev

# --- BEGIN node_modules_builder ---
FROM abcdesktopio/oc.software.18.04:$TAG as node_modules_builder
# ARG  BUILD_BALLON_PASSWORD

# 
#  Add dev package to node install
## You may also need development tools to build native addons:
##     sudo apt-get install gcc g++ make
RUN apt-get update && apt-get install -y  --no-install-recommends      \
	gcc                                                                     \
	g++                                                                     \
	make

# to make install wmctrljs nodejs components
# add build dev package 
RUN apt-get install -y  --no-install-recommends \
	libx11-dev \
	libxmu-dev 

COPY composer /composer

#Install yarn
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
RUN apt update && apt install yarn && apt-get clean

# Add nodejs service
RUN   yarn global add wait-port
RUN   cd /composer/node/common-libraries  && yarn install
RUN   cd /composer/node/ws-tcp-bridge     && yarn install	
RUN   cd /composer/node/broadcast-service && yarn install 
RUN   cd /composer/node/ocrun 	          && yarn install 
RUN   cd /composer/node/ocdownload        && yarn install
RUN   cd /composer/node/occall            && yarn install
RUN   cd /composer/node/file-service      && yarn install 
RUN   cd /composer/node/printer-service   && yarn install
RUN   cd /composer/node/spawner-service   && yarn install 
RUN   cd /composer/node/lync    	        && yarn install
RUN   cd /composer/node/xterm.js     	    && yarn install
# --- END node_modules_builder ---

FROM abcdesktopio/oc.software.18.04:$TAG
# ARG  BUILD_BALLON_PASSWORD

COPY --from=node_modules_builder /composer  /composer
COPY --from=node_modules_builder /usr/local/bin/wait-port /usr/local/bin/wait-port

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

RUN echo `date` > /etc/build.date

# Add here commands need to run as sudo user
# cupsd must be run as root
# changehomeowner 
RUN echo "$BUSER ALL=(root) NOPASSWD: /usr/sbin/cupsd" >> /etc/sudoers.d/cupsd
RUN echo "$BUSER ALL=(root) NOPASSWD: /composer/changehomeowner.sh" >> /etc/sudoers.d/changehomeowner

# create use default directory
RUN mkdir -p /home/$BUSER/.local/share/applications 	&& \
    mkdir -p /home/$BUSER/.local/share/applications/bin && \
    mkdir -p /home/$BUSER/.wallpapers			&& \
    mkdir -p /home/$BUSER/.local/share/Trash/		&& \
    mkdir -p /home/$BUSER/Desktop			&& \
    mkdir -p /home/$BUSER/.config			&& \
    mkdir -p /home/$BUSER/.config/qterminal.org

# 
# create a fake ntlm_auth.desktop file
# just to hidden missing link dest
RUN touch /usr/bin/ntlm_auth.desktop

RUN cp -p /composer/wallpapers/* /home/$BUSER/.wallpapers   
RUN cp -rp /composer/mime /home/$BUSER/.local/share
RUN cp -rp /composer/icons /home/$BUSER/.local/share
RUN update-mime-database /home/$BUSER/.local/share/mime


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
        /home/$BUSER/.config                            \
	/home/$BUSER/.local 				\
	/home/$BUSER/.wallpapers			\
	/home/$BUSER/.local/share/Trash			\
	/home/$BUSER/Desktop				\
	/etc/X11/openbox				\
	/var/log/desktop				\
	/var/run/desktop				\
	/composer/run					\
	/composer/mime					\
	/composer/icons					\
	/composer/wallpapers				\
	/composer/.themes				\
	/composer/.gtkrc-2.0				\
	/composer/.xsettings				\
	/composer/.gconf				\
	/composer/.Xressources				\
	/composer/.bashrc				\
	/composer/.cache				

# Clean unecessary package
RUN rm -rf /tmp/*
RUN apt-get autoremove --purge -y

# VOLUME /home/$BUSER
WORKDIR /home/$BUSER
USER $BUSER
CMD /composer/docker-entrypoint.sh

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

