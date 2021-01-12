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
const dominantColor = require('dominant-color');
const systempath = require('path');
const fs = require('fs');
const hexRgb = require('hex-rgb');

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
    dominantColor(tmpfilename, (errDominantColor, color) => {
      if (errDominantColor) {
        next(errDominantColor);
      } else {
        next(null, color);
      }
      fs.unlink(tmpfilename, () => {});
    });
  });
}

function covercolorborder(path, next) {
  const borderSides = ['North', 'South', 'West', 'East'];
  const borderColor = [];
  let currentSide = 0;

  function callback(err, color) {
    if (color) {
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
