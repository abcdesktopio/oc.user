FROM ubuntu:18.04

MAINTAINER Alexandre DEVELY

LABEL vcs-type "git"
LABEL vcs-url  "https://github.com/abcdesktopio/oc.user.18.04"
LABEL vcs-ref  "master"
LABEL release  "5"
LABEL version  "1.2"
LABEL architecture "x86_64"

# correct debconf: (TERM is not set, so the dialog frontend is not usable.)
ENV DEBCONF_FRONTEND noninteractive
ENV TERM linux
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections

RUN DEBIAN_FRONTEND=noninteractive  apt-get update && apt-get install -y  --no-install-recommends \
        apt-utils                       \
        && apt-get clean


RUN DEBIAN_FRONTEND=noninteractive  apt-get update && apt-get install -y  --no-install-recommends \
    	dialog 				\
    	debconf-utils 			\
    	software-properties-common 	\
	locales				\
	&& apt-get clean 

#    nginx
#    libterm-readline-gnu-perl 

RUN DEBIAN_FRONTEND=noninteractive apt-get update && apt-get install -y --no-install-recommends \
	language-pack-en \
	language-pack-fr \
	&& locale-gen	 \
        && apt-get clean

# RUN dpkg-reconfigure locales
# RUN locale-gen fr_FR.UTF-8
#    locale-gen C.UTF-8 
#    /usr/sbin/update-locale LANG=C.UTF-8
#ENV LC_ALL C.UTF-8



# python-software-properties is use for add-apt-repository
RUN DEBIAN_FRONTEND=noninteractive apt-get update && apt-get install -y --no-install-recommends \
    	software-properties-common 	\
   	net-tools 			\
    	libgtk-3-0 			\
    	libgtk-3-bin 			\
    	sudo 				\
    	curl 				\
        && apt-get clean
	


# Suppress warning about accessibility bus
# WARNING **: Couldn't connect to accessibility bus:
RUN echo "NO_AT_BRIDGE=1" >> /etc/environment

## Applications
# x11 libs
# supervisor 
# xsettings 
# xdotools 
# wmctrl 
RUN DEBIAN_FRONTEND=noninteractive  apt-get update && apt-get install -y --no-install-recommends \
	x11-utils 			\
	supervisor 			\
	x11-xserver-utils 		\
	xsettingsd			\
	xdotool 			\
	xdg-utils 			\
        wmctrl 				\
        && apt-get clean


##
# install Microsoft Fonts
# accept eula for mscorefonts package
RUN echo ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true | debconf-set-selections
		
## 
# install fonts and themes
RUN DEBIAN_FRONTEND=noninteractive  apt-get update && apt-get install -y --no-install-recommends \
	xfonts-base			\
        xfonts-encodings                \
        xfonts-utils                    \
	xfonts-100dpi			\
	xfonts-75dpi			\
	xfonts-cyrillic			\
        ubuntustudio-fonts              \
   	libfontconfig 			\
    	libfreetype6 			\
    	ttf-ubuntu-font-family 		\
	ttf-dejavu-core			\
        fonts-freefont-ttf		\
  	fonts-croscore                  \
        fonts-dejavu-core               \
        fonts-horai-umefont             \
        fonts-noto                      \
        fonts-opendyslexic              \
        fonts-roboto                    \
        fonts-roboto-hinted             \
        fonts-sil-mondulkiri            \
        fonts-unfonts-core              \
        fonts-wqy-microhei              \
	fonts-ipafont-gothic            \
        fonts-wqy-zenhei                \
        fonts-tlwg-loma-otf             \
        && apt-get clean

#
# install themes
RUN DEBIAN_FRONTEND=noninteractive  apt-get update && apt-get install -y --no-install-recommends \
        gnome-icon-theme                \
        gnome-icon-theme-symbolic       \
        gnome-font-viewer               \
        && apt-get clean


RUN DEBIAN_FRONTEND=noninteractive  apt-get update && apt-get install -y --no-install-recommends \
	pulseaudio 			\
	pulseaudio-utils 		\
        && apt-get clean

# add numix theme
RUN DEBIAN_FRONTEND=noninteractive add-apt-repository ppa:numix:ppa -y
RUN DEBIAN_FRONTEND=noninteractive apt-get update && apt-get install -y --no-install-recommends \
	numix-gtk-theme 	\
	numix-icon-theme-circle \
	numix-icon-theme-square \
 	&& apt-get clean

# Developper Section
RUN DEBIAN_FRONTEND=noninteractive  apt-get update && apt-get install -y --no-install-recommends \
	git wget unzip vim openssh-client build-essential make g++ \
        && apt-get clean



# X11
# openbox
# python-xdg python-xdgapp for autostart in openbox
# obconf for openbox 
#  
RUN DEBIAN_FRONTEND=noninteractive apt-get update && apt-get install -y --no-install-recommends  \
	python-xdg 		\
        obconf 			\
	x11-apps 		\
        lxappearance-obconf 	\
        lxappearance 		\
        gtk2-engines 		\
	gtk2-engines-pixbuf 	\ 
	gettext 		\
	autocutsel 		\
        && apt-get clean


# cups-pdf: pdf printer support
# scrot: screenshot tools
# smbclient need to install smb printer
# cups: printer support
RUN DEBIAN_FRONTEND=noninteractive apt-get update && apt-get install -y --no-install-recommends \
        smbclient	\
	cups-pdf 	\
	scrot  		\
        cups		\
        && apt-get clean


ADD openbox_18.04/*.deb /tmp/
RUN cd /tmp && \
    dpkg -i libobt2v5_3.6.1-7ubuntu0.1abcdesktoppatch11_amd64.deb && rm libobt2v5_3.6.1-7ubuntu0.1abcdesktoppatch11_amd64.deb && \
    dpkg -i libobrender32v5_3.6.1-7ubuntu0.1abcdesktoppatch11_amd64.deb  && rm libobrender32v5_3.6.1-7ubuntu0.1abcdesktoppatch11_amd64.deb && \
    dpkg -i openbox_3.6.1-7ubuntu0.1abcdesktoppatch11_amd64.deb && rm openbox_3.6.1-7ubuntu0.1abcdesktoppatch11_amd64.deb && \
    rm -rf /tmp/*.deb
    
# Change default access permission
# RUN chmod 755 /usr/lib/cups/backend/cups-pdf

