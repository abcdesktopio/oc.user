const process = require('process');
const roothomedir = `${process.env.HOME}`;
const abcdesktoprundir= `${process.env.ABCDESKTOP_RUN_DIR}`;
const abcdesktoplogdir= `${process.env.ABCDESKTOP_LOG_DIR}`;
const pathVersion = '/composer/version.json';
const applist = [ { key: 'xeyes.XEyes', path: '/usr/bin/xeyes' } ];

if (process.env.TARGET_MODE != "hardening" ) {
  // if this is not hardening add application qterminal
  applist.push( { key: 'qterminal.qterminal', path: '/usr/bin/qterminal'} );
}

if (!abcdesktoprundir) abcdesktoprundir= '/var/run/desktop';
if (!abcdesktoplogdir) abcdesktoplogdir= '/var/log/desktop';

///
// set when spawner-server starts
// read all files in folder '/var/lib/locales/supported.d/'
const supportedLanguages = []; // set when spawner-server start 

module.exports = {
  language: 'en_US', // default language
  applist,
  roothomedir,
  abcdesktoprundir,
  abcdesktoplogdir,
  supportedLanguages,
  pathVersion,
};
