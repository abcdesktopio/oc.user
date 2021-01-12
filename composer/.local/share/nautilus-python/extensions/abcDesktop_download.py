from gi.repository import Nautilus, GObject
import shellescape
import os
import gi

class AbcDesktopMenuProvider(GObject.GObject, Nautilus.MenuProvider):
    def __init__(self):
        gi.require_version('Nautilus', '3.0')
   
    def debug(self, msg):
        f = open("/var/log/abcdesktop/nautilus_abcdesktop_extension.log", "a")
        f.write(msg + '\n')
        f.close()

    def menu_activate_cb(self, menu, locations):
        # self.debug( 'type of location: ' + str( type(locations) ) )

        for f in locations:
	  try: 
            path = f.get_location().get_path()
	    escaped_path = shellescape.quote( path )
            command = "nodejs /composer/node/ocdownload/ocdownload.js " + escaped_path
            self.debug('menu_activate_cb runs ' + command )
            exit_code = os.system(command)
            self.debug('exit code: ' + str(exit_code) )
          except Exception as e:
	    self.debug('Exception: ' + str(e) )


    def get_file_items(self, window, files):
        # self.debug('get_file_items')
        item = Nautilus.MenuItem(name='AbcDesktopMenuProvider::Download', 
                                         label='Download for AbcDesktop', 
                                         tip='Download to local device',
                                         icon='')
        item.connect('activate', self.menu_activate_cb, files)

        return item,


