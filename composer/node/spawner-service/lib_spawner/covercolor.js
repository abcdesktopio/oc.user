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

const im = require('imagemagick');
const systempath = require('path');
const fs = require('fs');
const hexRgb = require('hex-rgb');

function dominantColor(path, opts, next){
  if (typeof opts === 'function'){
    next = opts
    opts = undefined
  }
  if (!next) next = function(){}
  if (!opts) opts = {}
  if (!opts.format) opts.format = 'hex'

  var imArgs = [path, '-scale', '1x1\!', '-format', '%[pixel:u]', 'info:-']

  im.convert(imArgs, function(err, stdout){
    if (err) next(err)
    // console.log( stdout );
    stdout = stdout.replaceAll( '%', '' ); 
    var rgb = stdout.substring(stdout.indexOf('(') + 1, stdout.indexOf(')'))

    // rgb=87.2724%,92.9305%,80.8743%,1
    //console.log( 'rgb=' + rgb );
    var results = {
      hex: function(){ return require('rgb-hex').apply(this, rgb.split(',')) },
      rgb: function(){ return rgb.split(',') }
    }

    //console.log( 'hex=' + results['hex']() );
    //console.log( 'rgb=' + results['rgb']() );	  
    next(null, results[opts.format]());
  })
}


function cropImage(path, gravity, next) {
  const crop = {
    North: '100%x5+0+0',
    South: '100%x5+0+0',
    West: '5x100%+0+0',
    East: '5x100%+0+0',
  };
  const cropprecent = crop[gravity];
  if (!cropprecent) { next('invalid params'); }

  const tmpsystemfilename = systempath.parse(path);
  tmpsystemfilename.base = `${gravity}.${tmpsystemfilename.base}`;
  const tmpfilename = systempath.format(tmpsystemfilename);

  const imArgs = [path, '-gravity', gravity, '-crop', cropprecent, tmpfilename];
  im.convert(imArgs, (err) => {
    if (err) next(err);

    console.log('call dominantColor(' + tmpfilename + ')' );
    dominantColor(tmpfilename, (errDominantColor, color) => {
      console.log('done dominantColor(' + tmpfilename + ')' ); 
      if (errDominantColor) {
	console.log( 'errDominantColor=' + errDominantColor );
        next(errDominantColor);
      } else {
	console.log( 'dominantColor=' + color );
        next(null, color);
      }
      fs.unlink(tmpfilename, () => {});
    });
  });
}

async function  mocolor( tmpfilename ) {
	let domlor = await domcolor(tmpfilename);
	return domlor;
}


function covercolorborder(path, next) {
  const borderSides = ['North', 'South', 'West', 'East'];
  //const borderSides = ['North'];
  const borderColor = [];
  let currentSide = 0;

  function callback(err, color) {
    if (color) {
      console.log( 'covercolorborder callback color=' + color );
      borderColor[currentSide] = hexRgb(color);
      ++currentSide;
      if (currentSide < borderSides.length) {
        cropImage(path, borderSides[currentSide], callback);
      } else {
        const mycolor = hexRgb('000000');
        for (let i = 0; i < borderColor.length; ++i) {
          mycolor.red += borderColor[i].red;
          mycolor.green += borderColor[i].green;
          mycolor.blue += borderColor[i].blue;
        }
        mycolor.red = Math.trunc(mycolor.red / borderColor.length);
        mycolor.green = Math.trunc(mycolor.green / borderColor.length);
        mycolor.blue = Math.trunc(mycolor.blue / borderColor.length);

        next(null, mycolor);
      }
    } else {
      console.log( 'covercolorborder callback error=' + err );
      next(`covercolorborder.callback:  error ${err}`, null);
    }
  }

  cropImage(path, borderSides[currentSide], callback);
}

function hextwoDigit(a) {
  return (a < 16) ? `0${a.toString(16)}` : a.toString(16);
}

function colortostring(color) {
  return hextwoDigit(color.red) + hextwoDigit(color.green) + hextwoDigit(color.blue);
}

function colortohashstring(color) {
  return `#${colortostring(color)}`;
}

// export methods
exports.covercolor = (path = '') => new Promise((resolve, reject) => {
  covercolorborder(path, (err, color) => {
    if (err) {
      reject(err);
    } else {
      resolve(color);
    }
  });
});
exports.colortostring = colortostring;
exports.colortohashstring = colortohashstring;
