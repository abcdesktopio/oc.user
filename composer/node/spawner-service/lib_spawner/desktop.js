/*
* Software Name : abcdesktop.io
* Version: 0.2
* SPDX-FileCopyrightText: Copyright (c) 2020-2021 Orange
* SPDX-License-Identifier: GPL-2.0-only
*
* This software is distributed under the GNU General Public License v2.0 only
* see the "license.txt" file for more details.
*
* Author: abcdesktop.io team
* Software description: cloud native desktop service
*/

/**
 * @typedef {Object} File
 * @property {String} path
 * @property {String} mimetype
 * @property {String} executablefilename
 * @property {String} icon
 * @property {String} name
 * @property {String} launch
 * @property {String} desktopfile
 */

const fs = require('fs');
const { remove: removeaccent } = require('diacritics');
const { spawn } = require('child_process');
const mime = require('mime-types');
const { extname } = require('path');
const { Magic, MAGIC_MIME_TYPE } = require('mmmagic');
const asyncHandler = require('express-async-handler');
const middlewares = require('./middlewares');
const { set, get } = require('./utils');
const { roothomedir, abcdesktoprundir, abcdesktoplogdir } = require('../global-values');
const magic = new Magic(MAGIC_MIME_TYPE);
const ini = require('./ini');
/**
 * 
 * @param {string} root 
 * @param {string} keywords 
 */
async function* filesearch(root = '', keywords = '') {
  const dirents = await fs.promises.readdir(root, { withFileTypes: true });
  const files = [];
  const directories = [];

  for (const dirent of dirents) {
    if (dirent.isSymbolicLink() || dirent.name[0] === '.') {
      continue;
    }

    if (dirent.isDirectory()) {
      directories.push(dirent.name);
    } else if (
        dirent.isFile()
        && dirent.name[0] !== '~'
        && dirent.name !== 'jetty' // Disable Eclipse
        ) {
        const filenameWithoutAccent = removeaccent(dirent.name);
        if (filenameWithoutAccent.search(keywords) !== -1) {
          const filepath = `${root}/${dirent.name}`;
          files.push({
            file: filepath,
            mime: mime.lookup(filepath),
          });
        }
    }
  }

  // Render files to caller function item by item
  yield* files;

  for (const directory of directories) {
    // Catch n+1 filesearch rendering
    yield* filesearch(`${root}/${directory}`, keywords);
  }
}

function supervisorctl( method, service_name ) {
  let command = '/usr/bin/supervisorctl';
  let args = [ method, service_name ];
  //if (!process.env[service_name]) {
  //	console.log( `ENV ${service_name} is not set` );
  //	console.log( `${command} ${method} ${service_name} is canceled` );
  //	return;
  //}
  console.log( command, method, service_name );
  cmd = spawn(command, args );
  cmd.stdout.on('data', (data) => {
  	console.log(`${command} stdout: ${data}`);
  });

  cmd.stderr.on('data', (data) => {
  	console.error(`${command} stderr: ${data}`);
  });

  cmd.on('close', (code) => {
  	console.log(`${command} child process exited with code ${code}`);
  }); 
}

/**
 *
 * @param {string} _filename
 */
function getmimeforfile(_filename) {
  // if filename start with a /
  // nothing to do
  // if filename does not start with a /
  // add the root homedir
  const filename = _filename.charAt(0) === '/' ? _filename : `${roothomedir}/${_filename}`;

  return new Promise((resolve, reject) => {
    magic.detectFile(filename, (err, result) => {
      if (err) {
        reject(err);
      } else {
        let res;
        // Hack for zip file
        if (result === 'application/x-gzip') {
          const extension = extname(filename);
          try {
            res = mime.lookup(extension);
          } catch (e) {
            reject(e);
            return;
          }
        }
        console.log(res);
        resolve(res);
      }
    });
  });
}

function generateIconfile( contentdesktop, icondata ) {  
  let iconpromise = fs.promises.writeFile(   
	contentdesktop.Icon,
        icondata,
        'base64',
        (err) => {
          if (err)
            console.log( `error in write icon file ${contentdesktop.Icon} ${err}` );
	  else
	    console.log( `create a new file ${contentdesktop.Icon}` );
        }
  );
  return iconpromise;
}

function update_desktop_database() {
  // All desktop files are created in ${roothomedir}/.local/share/applications
  // run update-desktop-database
  console.log(`update-desktop-database ${roothomedir}/.local/share/applications`);
  const command = spawn('/usr/bin/update-desktop-database', [ '-v', `${roothomedir}/.local/share/applications`]);
  command.stderr.on('data', (data) => {
    console.log(`update-desktop-database: stderr ${data}`);
  });
  command.stdout.on('data', (data) => {
    console.log(`update-desktop-database: stdout ${data}`);
  });
  command.on('close', (code) => {
    console.log(`update-desktop-database process exited with code ${code}`);
  });
}

function startservices() {
	// call update_desktop_database ${HOME}/.local/share/applications
	update_desktop_database();
	// call supervisorctl start plasmashell
	supervisorctl( 'start', 'plasmashell' );
}

function symlinkPromise( ocrunpath, execcommand)
{
  let symlink = fs.promises.symlink( ocrunpath, execcommand, 'file',
                         (err) => {
                                if (err)
                                {
                                  // skip errno EEXIST
                                  if (err.errno && err.errno === -17) {
                                     console.log( `Symlink already exists ${execcommand}` );
                                  }
                                  else
                                     console.log(err);
                                }
                                else
                                  console.log( `Symlink created ${execcommand}` );
                         }
   ).catch( (err) => { console.log(`fs.promises.symlink error ${err}`); } );
   return symlink;
}


async function updateplasma_org_kde_plasma_desktop_appletsrc( launchers_list = []) {
        // convert launchers_list to string launchers
        let launchers = "launchers=";
        //launchers=applications:firefox.desktop,applications:org.gnome.Nautilus.desktop,applications:frontendjs.webshell.desktop
        launchers_list.forEach( (app,index) => {
                launchers += `applications:${app}`;
                if (index+1 < launchers_list.length)
                 launchers += `,`;
        });
        console.log( launchers );


	// same as 
	// kwriteconfig5 --file ~/.config/plasma-org.kde.plasma.desktop-appletsrc --group Containments --group 48 --group Applets --group 51 --group Configuration --group General --key launchers data-launchers
	//
        // open .config/plasma-org.kde.plasma.desktop-appletsrc
        const appletsrc_filename = `${roothomedir}/.config/plasma-org.kde.plasma.desktop-appletsrc`;
        let appletsrc_content = fs.readFileSync( appletsrc_filename, { encoding : 'utf-8' });
        let newfile_content = "";
        appletsrc_content.split(/\r?\n/).forEach(line =>  {
          if (line.startsWith('launchers=')) {
                  line = launchers;
          }
          newfile_content = newfile_content + line + '\n';
        });
        fs.writeFileSync( appletsrc_filename, newfile_content, { encoding : 'utf-8' } );
}

/**
 * @param {Array<File>} list
 * @param {Function} callback
 * @desc Build .desktop files to run containerized applications
 */
async function generateDesktopFiles(list = []) {
  console.log('generateDesktopFiles');
  console.log(`list of application len is ${list.length}`);	
  const ocrunpath = '/composer/node/ocrun/ocrun.js';
  const ocrunpath_builtin  = '/composer/node/ocrun/ocrun.builtin.js';
  const ocrunpath_frontendjs = '/composer/node/ocrun/ocrun.frontendjs.js';
  console.log('generateDesktopFiles start');

  // stop plasmashell
  // supervisorctl( 'stop', 'plasmashell' );

  // dump applist.json file 
  fs.promises.writeFile( `${abcdesktoplogdir}/applist.json`, JSON.stringify(list, null, 2) )
    .catch( (err) => { console.log(`promises.writeFile error ${err}`); } );

  // remove entry if launch key is not set
  let i = list.length-1;
  while (i >= 0) {
    if ( !list[i].icon   || list[i].icon.length === 0 ||
         !list[i].launch || list[i].launch.length === 0 ) {
	    // launch is undefined, and this is an error
	    // or icon is undefined 
            // remove the entry
	    console.log( `removing bad app entry in applist ${list[i]}` );
            list.splice(i,1);
    }
    --i;
  }

  // check that the list is safe for async call
  // the desktopfile must be unique
  // only one desktopfile per application
  let desktopfileflag = {};

  i = 0;
  // create a safe list with desktopfile for each entry
  // make sure that desktopfile name execmode are defined 
  // else create entry using launch value 
  while (i < list.length) {
    if (!list[i].desktopfile) {
            // if the desktopfile is not defined by the application metadata, we create a new one
	    console.log( `desktopfile is missing for ${list[i].launch}` );
            list[i].desktopfile = `${list[i].launch}.desktop`;
    }
    if (!list[i].name) 
	  list[i].name = list[i].launch;
    if (!list[i].execmode) 
	  list[i].execmode = 'container';
    ++i;
  }

  i = list.length-1;
  // create a safe list with desktopfile for each entry
  while (i >= 0) {
    if (desktopfileflag[ list[i].desktopfile ]) {
            // if the desktopfile is already defined
	    // this is an error
	    // remove the entry
	    console.log( `removing double desktopfile ${list[i].desktopfile }`);
            list.splice(i,1);
    }
    else {
	desktopfileflag[ list[i].desktopfile ] = true; 
    }
    --i;
  }


  let allPromises = [];
  // now the list is safe for async call
  let dockapplicationlist = [];
  mimeappslist = {};

  i=0;
  while (i < list.length) {
      let mimetype = list[i].mimetype;
      let showinview = list[i].showinview;
      let path = list[i].path;
      let executablefilename = list[i].executablefilename;
      let execmode = list[i].execmode;
      let icon = list[i].icon;
      let icondata = list[i].icondata;
      let icon_url = list[i].icon_url;
      let name = list[i].name;
      let launch = list[i].launch;
      let displayname = list[i].displayname;
      let cat = list[i].cat;
      let desktopfile = list[i].desktopfile;
      let usedefaultapplication = list[i].usedefaultapplication;
      const desktopfilepath  = `${roothomedir}/.local/share/applications/${desktopfile}`;
      console.log(`creating a new desktop file ${desktopfilepath} for application name=${name}` ); 
      
      // create contentdesktop	    
      const contentdesktop = {};
      const execcommand = `${roothomedir}/.local/share/applications/bin/${launch}`;
      contentdesktop.Name = displayname;
      contentdesktop.Exec = `${execcommand} %U`;
      if (mimetype && mimetype.length > 0) {
        contentdesktop.MimeType = `${mimetype.join(';')};`;
	// associate each mimetype to the desktop file
	mimetype.forEach((item) => {
	  if (mimeappslist[item]) {
	    mimeappslist[item] += ';' + desktopfile;
	  }
  	  else {
	    mimeappslist[item] = desktopfile;
          }
	});
      }
      contentdesktop.Type = 'Application';
      contentdesktop.Icon = `${roothomedir}/.local/share/icons/${icon}`;
      if (cat)
        contentdesktop.Categories = cat;
      
      let linktargetfile = ocrunpath;
      if (execmode === 'builtin') linktargetfile=ocrunpath_builtin;
      if (execmode === 'frontendjs') linktargetfile=ocrunpath_frontendjs;

      // this call is sync 
      // make sure that the desktopfile exists for next promise
      fs.writeFileSync( desktopfilepath, ini.stringify(contentdesktop, { section: "Desktop Entry" }) );
      if (icon && icondata)
      	allPromises.push( generateIconfile( contentdesktop, icondata ) );
      allPromises.push( symlinkPromise( linktargetfile, execcommand ) );

      // if this application must be show in dock
      if (showinview === 'dock') 
	dockapplicationlist.push( desktopfile );
      ++i;
  }

  // create $HOME/.config/mimeapps.list 
  // if there is some items
  if (Object.keys(mimeappslist).length > 0) {
      	// write file to .config/mimeapps.list
	let mimeappsfilepath = `${roothomedir}/.config/mimeapps.list`;
	console.log( `create file ${mimeappsfilepath}` );
	// .config/mimeapps.list is an ini file like format
	let filemimeappscontent = '[Default Applications]\n';
	// add mimetype = desktop file
	for (let mimekey in mimeappslist) {
	  filemimeappscontent += `${mimekey}=${mimeappslist[mimekey]}\n`; 
	}
	// write file
  	fs.writeFile( 
	  mimeappsfilepath, 
	  filemimeappscontent, 
	  (err) => {
            if (err) 
		  console.log( `error ${err}  ${mimeappsfilepath}`  );
	    else
           	  console.log( `${mimeappsfilepath} saved successful`);
          }
  	);
  }

  Promise.all( allPromises )
  .then((values) => {})
  .catch(err => { console.log('allpromises.writeFile error' + err);} )
  .finally(() => {
    updateplasma_org_kde_plasma_desktop_appletsrc( dockapplicationlist );
    console.log('updateplasma_org_kde_plasma_desktop_appletsrc completed');
    startservices();
    console.log('startservices completed');
  });
  return Promise.resolve({ code: 200, data: 'OK' });
}

/**
 *
 * @param {string} filename
 */
function getappforfile(filename = '') {
  console.log('START findapplicationforfile ');
  console.log(`findapplicationforfile ${filename}`);
  // comand seems to be a data file
  const mimeopen = spawn('/composer/node/spawner-service/mimeopen', [filename]);
  let stdout = null;
  const file = filename;

  mimeopen.stdout.on('data', (output) => {
    console.log(output);
    stdout = output;
  });

  return new Promise((resolve) => {
    mimeopen.on('close', (code) => {
      const ret = { code: null, data: '' };
      if (code === 0) {
        const resp = String(stdout);
        const arr = resp.split(' ');
        const ucommand = arr.shift();
        const uargs = [];

        for (let i = 0; !file.startsWith(arr[i]) && i < arr.length; i++) {
          uargs.push(arr[i]);
        }

        console.log(ucommand);
        console.log(uargs);
        const result = {
          command: ucommand,
          args: uargs,
        };
        ret.code = 200;
        ret.data = result;
      } else {
        // Application not found for file type
        console.log(`mimeopen stdout ${stdout}`);
        console.log(`mimeopen exited with code ${code}`);
        ret.code = 404;
        ret.data = stdout;
      }
      resolve(ret);
    });
  });
}

/**
 *
 * @param {*} router
 */
function routerInit(router) {
  /**
   * @swagger
   *
   * /setDesktop:
   *  post:
   *    description: Store a data as json file in desktop
   *    requestBody:
   *      content:
   *        application/json:
   *          schema:
   *            type: object
   *            required:
   *            - key
   *            - value
   *            properties:
   *              key:
   *                type: string
   *              value:
   *                type: string
   *    produces:
   *      - application/json
   *    responses:
   *      '500':
   *        schema:
   *          $ref: '#/definitions/InternalError'
   *      '200':
   *        schema:
   *          $ref: '#/definitions/Success'
   */
  router.post('/setDesktop', middlewares.get('setDesktop'), asyncHandler(async (req, res) => {
    const { key = '', value = '' } = req.body;
    const ret = { code: 500, data: 'error' };
    const { code, data } = await set(key, value);
    ret.code = code;
    ret.data = data;
    res.status(ret.code).send(ret);
  }));

  /**
   * @swagger
   *
   * /getDesktop:
   *  get:
   *    description: Get a data stored as json file
   *    produces:
   *      - application/json
   *    parameters:
   *    - in: query
   *      required: true
   *      name: key
   *      schema:
   *        type: string
   *
   *    responses:
   *      '500':
   *        schema:
   *          $ref: '#/definitions/InternalError'
   *      '200':
   *        schema:
   *          properties:
   *            code:
   *              type: integer
   *            data:
   *              type: object
   */
  router.get('/getDesktop', middlewares.get('getDesktop'), asyncHandler(async (req, res) => {
    const { key = '' } = req.query;
    const ret = { code: 200, data: 'ok' };
    const { code, data } = await get(key);
    ret.code = code;
    ret.data = data;
    res.status(ret.code).send(ret);
  }));

  /**
   * @swagger
   *
   * definitions:
   *  MIME:
   *    type: object
   *    properties:
   *      data:
   *        type: object
   *
   * /getmimeforfile:
   *  get:
   *    description: Get a mime for a given filename
   *    produces:
   *      - application/json
   *    parameters:
   *    - in: query
   *      name: filename
   *      type: string
   *      required: true
   *    responses:
   *      '500':
   *        schema:
   *          $ref: '#/definitions/InternalError'
   *      '200':
   *        schema:
   *          $ref: '#/definitions/MIME'
   */
  router.get('/getmimeforfile', middlewares.get('getmimeforfile'), asyncHandler(async (req, res) => {
    const { filename = '' } = req.query;
    const ret = { code: 200, data: 'ok' };
    const result = await getmimeforfile(filename);
    ret.data = result;
    res.status(ret.code).send(ret.data);
  }));

  /**
   * @swagger
   *
   * /filesearch:
   *  get:
   *    description: Used for list files by dock
   *    produces:
   *      - application/json
   *    parameters:
   *    - in: query
   *      name: maxfile
   *      type: integer
   *      default: 64
   *    - in: query
   *      name: keywords
   *      type: string
   *      required: true
   *    responses:
   *      '500':
   *        schema:
   *          $ref: '#/definitions/InternalError'
   *      '200':
   *        schema:
   *          type: object
   *          properties:
   *            code:
   *              type: integer
   *            data:
   *              type: array
   *              items:
   *                type: object
   *                properties:
   *                  file:
   *                    type: string
   *                  mime:
   *                    type: string
   */
  router.get('/filesearch', middlewares.get('filesearch'), asyncHandler(async (req, res) => {
    const { maxfile = 64, keywords = '' } = req.query;
    const ret = {
      code: 200,
      data: [],
    };

    const files = [];

    for await (const filename of filesearch(roothomedir, removeaccent(keywords))) {
      if (req.aborted) {
        break;
      }

      files.push(filename);

      if (files.length > maxfile) {
        break;
      }
    }

    ret.data = files;
    res.status(ret.code).send(ret);
  }));

  /**
   * @swagger
   *
   * /generateDesktopFiles:
   *  post:
   *    description: Build desktop files to run containerized applications
   *    requestBody:
   *      content:
   *        application/json:
   *          schema:
   *            type: object
   *            required:
   *            - list
   *            properties:
   *              list:
   *                type: array
   *                items:
   *                  type: object
   *                  properties:
   *                    mimetype:
   *                      type: string
   *                    path:
   *                      type: string
   *                    executablefilename:
   *                      type: string
   *                    icon:
   *                      type: string
   *                    name:
   *                      type: string
   *                    launch:
   *                      type: string
   *    produces:
   *      - application/json
   *    responses:
   *      '500':
   *        schema:
   *          $ref: '#/definitions/InternalError'
   *      '200':
   *        schema:
   *          $ref: '#/definitions/Success'
   */
  router.post('/generateDesktopFiles', middlewares.get('generateDesktopFiles'), asyncHandler(async (req, res) => {
    const { list = [] } = req.body;
    const ret = await generateDesktopFiles(list);
    res.status(ret.code).send(ret);
  }));

  /**
   * @swagger
   *
   * definitions:
   *   AppForFile:
   *      type: object
   *      properties:
   *        code:
   *          type: integer
   *        data:
   *          type: array
   *          items:
   *            type: object
   *            properties:
   *              command:
   *                type: string
   *              args:
   *                type: string
   * /getappforfile:
   *  get:
   *    description: Allow to get the app necessary
   *    produces:
   *      - application/json
   *    responses:
   *      '500':
   *        schema:
   *          $ref: '#/definitions/InternalError'
   *      '200':
   *        schema:
   *          $ref: '#/definitions/AppForFile'
   */
  router.get('/getappforfile', middlewares.get('getappforfile'), asyncHandler(async (req, res) => {
    const { filename = '' } = req.query;
    const ret = await getappforfile(filename);
    res.status(ret.code).send(ret);
  }));
}

module.exports = { routerInit };
