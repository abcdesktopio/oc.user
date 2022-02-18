#!/usr/bin/python3
# EASY-INSTALL-ENTRY-SCRIPT: 'websockify>=0.9.0','console_scripts','websockify'
__requires__ = 'websockify>=0.9.0'
import re
import sys
from pkg_resources import load_entry_point

if __name__ == '__main__':
    sys.argv[0] = re.sub(r'(-script\.pyw?|\.exe)?$', '', sys.argv[0])
    sys.exit(
        load_entry_point('websockify>=0.9.0', 'console_scripts', 'websockify')()
    )
