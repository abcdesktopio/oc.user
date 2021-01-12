#!/bin/sh

ffmpeg -y -f pulse -i null.monitor  -rtbufsize 64 -probesize 64 \
-acodec pcm_s16le -ar 44100 -ac 1 -f wav -fflags +nobuffer \
-packetsize 512 - \
| nodejs stdinstreamer.js -port 8000 -type wav -chunksize 512
