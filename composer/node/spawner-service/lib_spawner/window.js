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

const wmctrljs = require('wmctrljs');
const asyncHandler = require('express-async-handler');
const middlewares = require('./middlewares');

/**
 * @typedef {Object<>} Screen
 * @property {number} width
 * @property {number} height
 * @property {number} titleHeight
 * @property {Array<number>} listWid
 * @property {Function} maximiseOneWindow
 * @property {Function} dispatchWindows
 */

/**
 *
 * @typedef  {Object<>} TypeDesc
 * @property {string} flag
 * @property {number} number
 */

/**
 * @typedef  {Object<>} Geometry
 * @property {number} x
 * @property {number} y
 * @property {number} abs_x
 * @property {number} abs_y
 * @property {number} width
 * @property {number} height
*/

/**
 * @typedef {Object<>} Aspect
 * @property {number} x //numerator
 * @property {number} y //denominator
*/

/**
 * @typedef {Object<>} XSizeHints
 * @property {number} flags
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {number} min_width
 * @property {number} min_height
 * @property {number} max_width
 * @property {number} max_height
 * @property {number} width_inc
 * @property {number} height_inc
 * @property {Aspect} min_aspect
 * @property {Aspect} max_aspect
 * @property {number} base_width
 * @property {number} base_height
 * @property {number} win_gravity
*/

/**
 *  @typedef {Object<>} Window
 * @property {number} win_id
 * @property {number} win_pid
 * @property {string} win_client_machine
 * @property {string} win_class
 * @property {Array<TypeDesc>} win_types
 * @property {Array<TypeDesc>} win_actions
 * @property {Array<TypeDesc>} win_states
 * @property {string} win_name
 * @property {string} win_visible_name
 * @property {string} win_icon_name
 * @property {Geometry} win_geometry
 * @property {number} wm_normal_hints_supplied
 * @property {XSizeHints|undefined} WM_NORMAL_HINTS
 * @property {XSizeHints|undefined} WM_HINTS
 * @property {number} desktop_number
 * @property {number} showing_desktop
 * @property {number} desktop_number
 * @property {FrameExtents|undefined} frame_extents
 */

/**
  * @typedef {Object<>} Point
  * @property {number} x
  * @property {number} y
  */

/**
 * @function getDistance
 * @param {number} a
 * @param {number} b
 * @returns {number}
 * @desc A basic mathematical formulas for calculate a distance between two points
 */
function getDistance(a, b) {
  return Math.sqrt(((b.x - a.x) ** 2) + ((b.y - a.y) ** 2));
}

/**
 * @function getNearWindow
 * @param {Point} anchor
 * @param {Array<Window>} windows
 * @returns {Window}
 * @desc Calculate all distances between an anchor
 * and all windows's points and select the window who own the min distance
 */
function getNearWindow(anchor, windows) {
  const distances = [];
  for (const win of windows) {
    const {
      abs_x: absX,
      abs_y: absY,
      width,
      height,
    } = win.win_geometry;

    const topLeftDistance = getDistance(anchor, {
      x: absX,
      y: absY,
    });

    const topRightDistance = getDistance(anchor, {
      x: absX + width,
      y: absY,
    });

    const bottomLeftDistance = getDistance(anchor, {
      x: absX,
      y: absY + height,
    });

    const bottomRightDistance = getDistance(anchor, {
      x: absX + width,
      y: absY + height,
    });

    const windowDistances = [
      topLeftDistance,
      topRightDistance,
      bottomLeftDistance,
      bottomRightDistance,
    ].map((distance) => ({ distance, id: win.win_id })); // Map all distances with a window id

    distances.push(...windowDistances);
  }

  const reducer = (prev, current) => (prev.distance > current.distance ? current : prev);
  const minDistance = distances.reduce(reducer);
  // each window has four distances with the anchor point,
  // and the window who own the min distance will be selected

  return windows.find((win) => win.win_id === minDistance.id);
  // Just return the selected window (can't be undefiend)
}

/**
 * @function createAnchorListLandscape
 * @param {Screen} screenDims
 * @param {number} windowCount
 * @returns {Array<Point>}
 * @desc Provide an anchor list for landscape screen
 */
function createAnchorListLandscape(screenDims, windowCount) {
  const anchors = [];
  const { width: screenWidth, height: screenHeight } = screenDims;

  if (windowCount % 2 !== 0) { windowCount++; }

  const halfSizeList = parseInt(windowCount / 2, 10);
  const step = screenWidth / halfSizeList;

  for (let i = 0; i < windowCount; i++) {
    const isFirstRow = i < halfSizeList;
    const anchor = {
      x: step * (isFirstRow ? i : i - halfSizeList),
      y: isFirstRow ? 0 : screenHeight / 2,
    };
    anchors.push(anchor);
  }

  return anchors;
}

/**
 * @function createAnchorListPortrait
 * @param {Screen} screen
 * @param {number} windowCount
 * @desc Provide an anchor list for portrait screen
 */
function createAnchorListPortrait(screen, windowCount) {
  const anchors = [];
  const {
    width: screenWidth,
    height: screenHeight,
    titleHeight,
  } = screen;

  if (windowCount % 2 !== 0) { windowCount++; }

  const halfSizeList = parseInt(windowCount / 2, 10);
  const step = (screenHeight / halfSizeList) + titleHeight; // A window height

  for (let i = 0; i < windowCount; i++) {
    const firstColumn = i < halfSizeList;
    const anchor = {
      x: firstColumn ? 0 : screenWidth / 2,
      y: step * (firstColumn ? i : i - halfSizeList),
    };
    anchors.push(anchor);
  }

  return anchors;
}

/**
 * @param {Point[]} anchors
 * @param {Window[]} windows
 * @desc Sort the windows list in the same order as anchors list
 * by matching all windows with an anchor
 */
function sortWindowsByAnchor(anchors, windows) {
  const cpWindows = [...windows];
  const entries = anchors.entries();
  for (const [i, anchor] of entries) {
    if (i !== windows.length) {
      const window = getNearWindow(anchor, cpWindows);
      cpWindows.splice(cpWindows.indexOf(window), 1);
      const indexNearWindow = windows.indexOf(window);
      if (i !== indexNearWindow) {
        const tmpCurrentWindow = windows[i];
        windows[i] = window;
        windows[indexNearWindow] = tmpCurrentWindow;
      }
    }
  }
}

/**
 * @function placeWindow
 * @param {Window} win
 * @param {number} winWidth
 * @param {number} winHeight
 * @param {number} winPositionX
 * @param {number} winPositionY
 * @returns {Promise<void>}
 * @desc Active the target window, take off his states then move and resize it
 * Note: if those states are present (fullscreen, maximized_vert, maximized_horz)
 * the window can't be move or resize
 */
async function placeWindow(win, winWidth, winHeight, winPositionX, winPositionY) {
  await wmctrljs.activeWindowById(win.win_id);
  if (win.win_states instanceof Array
        && win.win_states.length !== 0) {
    // Remove FULLSCREEN and MAXIMIZED states, for enable window resizing
    for (const state of win.win_states) {
      if (state.flag === '_NET_WM_STATE_FULLSCREEN') {
        /*
                    Remove fillscreen state
                 */
        await wmctrljs.windowState(win.win_id, 'remove', 'fullscreen');
        break;
      }
    }

    for (const state of win.win_states) {
      if (state.flag === '_NET_WM_STATE_MAXIMIZED_HORZ'
                    || state.flag === '_NET_WM_STATE_MAXIMIZED_VERT') {
        /*
            In more common case _NET_WM_STATE_MAXIMIZED_HORZ is present
            with _NET_WM_STATE_MAXIMIZED_VERT then we just remove both, even if only one is present.
            That prevent to make a syscall of more and
            this is perfectly support by wmctrljs library.
        */
        await wmctrljs.windowState(win.win_id, 'remove', 'maximized_horz', 'maximized_vert');
        break;
      }
    }
  }
  return wmctrljs.windowMoveResize(
    win.win_id,
    0,
    winPositionX,
    winPositionY,
    winWidth,
    winHeight,
  );
}

/**
 * @function inRange
 * @param {number} x
 * @param {number} min
 * @param {number} max
 * @returns {boolean}
 */
function inRange(x, min, max) {
  return (x - min) * (x - max) <= 0;
}

/**
 * @param {number} seconds
 */
function wait(seconds) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, seconds * 1000);
  });
}

/**
 * @param {Screen} screen
 * @param {Window[]} listWin
 * @param {number} index
 * @returns {Object<{width:number, height:number}>}
 */
function genSizeWindowLandscape(screen, listWin, index) {
  const even = listWin.length % 2 === 0;
  const halfSizeList = parseInt(listWin.length / 2, 10);
  const halfHeightScreen = screen.height / 2;

  let width = even ? screen.width / halfSizeList : screen.width / (halfSizeList + 1);
  let height = halfHeightScreen - screen.titleHeight;

  if (!even && index === halfSizeList) {
    height *= 2;
    height += screen.titleHeight;
  }

  width = parseInt(width, 10);
  height = parseInt(height, 10);

  if (listWin.length === 2) {
    width = parseInt(width / 2, 10) + 1;
    height = parseInt(screen.height - screen.titleHeight, 10);
  }
  return { width, height };
}

/**
 * @param {Screen} screen
 * @param {Window[]} listWin
 * @param {number} index
 * @returns {Object<{width:number, height:number}>}
 */
function genSizeWindowPortrait(screen, listWin, index) {
  const even = listWin.length % 2 === 0;
  const halfSizeList = parseInt(listWin.length / 2, 10) + (even ? 0 : 1);
  const halfWidthScreen = screen.width / 2;
  const firstRow = index === 0 || index === halfSizeList;
  let width = halfWidthScreen;
  let height = screen.height / halfSizeList;

  height -= screen.titleHeight;

  if (!firstRow && !even && index === halfSizeList - 1) { width *= 2; }

  if (!even && index === halfSizeList) {
    height *= 2;
    height += screen.titleHeight;
  }

  width = parseInt(width, 10);
  height = parseInt(height, 10);

  if (listWin.length === 2) {
    width = parseInt(width / 2, 10) + 1;
    height = parseInt(screen.height - screen.titleHeight, 10);
  }

  return { width, height };
}

/**
 * @param {Window} win
 * @param {number} width
 * @param {number} height
 * @returns {boolean}
 */
function unAuthorizedSizes(win, width, height) {
  if (win.win_types.map((t) => t.flag).includes('_NET_WM_WINDOW_TYPE_DIALOG')) { return true; }

  const maxWidth = win.WM_NORMAL_HINTS.max_width;
  const maxHeight = win.WM_NORMAL_HINTS.max_height;
  const minWidth = win.WM_NORMAL_HINTS.min_width;
  const minHeight = win.WM_NORMAL_HINTS.min_height;
  let minSizesUnauthorized;
  let maxSizesUnauthorized;

  if (minWidth === 0 && minHeight === 0) {
    // Doesn't have min for size
    minSizesUnauthorized = false; // No restriction
  } else if (minWidth === 0 && minHeight !== 0) {
    // Doesn't have min for width but have height
    minSizesUnauthorized = width < minWidth;
    // If asked width lower than minWidth resize can't be done
  } else if (minWidth !== 0 && minHeight === 0) {
    // Doesn't have min for height but have width
    minSizesUnauthorized = height < minHeight;
    // If asked height lower than minHeight resize can't be done
  } else { // Have minHeight and minWidth restrictions
    minSizesUnauthorized = width < minWidth || height < minHeight;
    // If asked width lower than minWidth or asked height lower than minHeight resize can't be done
  }

  if (maxWidth === 0 && maxHeight === 0) { // Doesn't have max for size
    maxSizesUnauthorized = false; // No restriction
  } else if (maxWidth === 0 && maxHeight !== 0) {
    // Doesn't have max for width but have for height
    maxSizesUnauthorized = height > maxHeight;
    // If asked height grater than maxHeight resize can't be done
  } else if (maxWidth !== 0 && maxHeight === 0) {
    // Doesn't have max for height but have for width
    maxSizesUnauthorized = width > maxWidth;
    // If asked width grater than maxWidth resize can't be done
  } else {
    maxSizesUnauthorized = width > maxWidth || height > maxHeight;
  }

  return minSizesUnauthorized || maxSizesUnauthorized;
}

/**
 * @param {Window} w
 * @param {number} posX
 * @param {number} posY
 * @param {Screen} screen
 * @returns {Promise<void>}
 * @desc Check if a window has the good coordinates for a window landscape screen
 */
async function checkWindowPlacementLandscape(w, posX, posY, screen) {
  const win = await wmctrljs.getWindowById(w.win_id);
  const { top } = win.frame_extents;
  const { abs_y: absYFirstRow } = win.win_geometry;
  const absYSecondRow = parseInt(Math.abs(absYFirstRow - (screen.height / 2)), 10);

  if (top === 0) {
    const halfScreenHeight = screen.height / 2;
    if (!inRange(win.win_geometry.height, halfScreenHeight - 10, halfScreenHeight + 10)) {
      await wait(0.2);
      await wmctrljs.windowMoveResize(
        win.win_id,
        0,
        -1,
        -1,
        -1,
        win.win_geometry.height + screen.titleHeight,
      );
    }
  } else if (inRange(absYFirstRow, 0, 10) || inRange(absYSecondRow, 0, 10)) {
    await wait(0.2);
    await wmctrljs.windowMoveResize(win.win_id, 0, -1, posY + screen.titleHeight, -1, -1);
  }
}

/**
 * @param {Screen} screen
 * @param {Window[]} listWin
 * @returns {Promise}
 */
function dispatchLandscape(screen, listWin) {
  const promiesAllMoves = [];
  const {
    titleHeight,
    width: screenWidth,
    height: screenHeight,
  } = screen;

  for (let index = 0; index < listWin.length; index++) {
    let posX;
    let posY;
    const win = listWin[index];

    const {
      abs_x: currentX,
      abs_y: currentY,
      width: currentWidth,
      height: currentHeight,
    } = win.win_geometry;

    let mustDispatch = false;
    const even = listWin.length % 2 === 0;
    const halfSizeList = parseInt(listWin.length / 2, 10);
    const halfHeightScreen = screenHeight / 2;
    let firstRow = index < halfSizeList;
    const { width, height } = genSizeWindowLandscape(screen, listWin, index);

    if (!even && index === halfSizeList) { // odd and its the last window of the first row
      posX = halfSizeList * width;
      firstRow = true;
    } else if (!firstRow && !even) posX = (index % (halfSizeList + 1)) * width;
    else posX = (index % halfSizeList) * width;

    posY = firstRow ? 0 : halfHeightScreen + 1;
    posX = parseInt(posX, 10);
    posY = parseInt(posY, 10);

    if (listWin.length === 2) {
      posX = index !== 0 ? parseInt(screenWidth / 2, 10) : 0;
      posY = 0;
    }

    if (!inRange(currentX, posX - 2, posX + 2)) { mustDispatch = true; }

    const hasGoodPlaceForFirstRow = inRange(
      currentY,
      titleHeight - 2,
      titleHeight + 2,
    )
        && posY === 0;
    const hasGoodPlaceForSecondRow = inRange(
      currentY,
      titleHeight + posY - 2,
      titleHeight + posY + 2,
    );

    // It's append som window does'nt take in consideration the titleHeight in theirs position
    if ((!hasGoodPlaceForFirstRow && !hasGoodPlaceForSecondRow)
            && !inRange(currentY, posY - 2, posY + 2)
    ) { mustDispatch = true; }

    if (currentHeight !== height
                && !inRange(currentHeight, height + titleHeight - 2, height + titleHeight + 2)
                // The same issue as before
    ) { mustDispatch = true; }

    if (currentWidth !== width) { mustDispatch = true; }

    if (mustDispatch) {
      const move = placeWindow(win, width, height, posX, posY);
      move.then(() => {
        checkWindowPlacementLandscape(win, posX, posY, screen)
          .catch((error) => {
            console.error(error);
          });
      })
        .catch(console.error);
      promiesAllMoves.push(move);
    } else { // If window already placed but doesn't is hidden
      const flags = win.win_states.map((st) => st.flag);
      if (flags.includes('_NET_WM_STATE_HIDDEN')) {
        wmctrljs.activeWindowById(win.win_id)
          .catch(console.error);
      }
    }
  }
  return Promise.all(promiesAllMoves);
}

/**
 * @function checkWindowPlacementPortrait
 * @param {Window} w
 * @param {number} posX
 * @param {number} posY
 * @param {Screen} screen
 * @returns {Promise<void>}
 * @desc Check if a window has the good coordinates for a window in portrait screen
 */
async function checkWindowPlacementPortrait(w, posX, posY, screen) {
  const win = await wmctrljs.getWindowById(w.win_id);
  const { top } = win.frame_extents;
  const { abs_y: absYFirstRow, height } = win.win_geometry;

  if (top === 0) {
    const halfScreenHeight = screen.height / 2;
    if (!inRange(win.win_geometry.height, halfScreenHeight - 10, halfScreenHeight + 10)) {
      await wait(0.2);
      await wmctrljs.windowMoveResize(win.win_id, 0, posX, posY, -1, height + screen.titleHeight);
    }
  } else if (inRange(absYFirstRow, posY - 10, posY + 10)) {
    await wait(0.2);
    await wmctrljs.windowMoveResize(win.win_id, 0, posX, posY + screen.titleHeight, -1, -1);
  }
}

/**
 * @function dispatchPortrait
 * @param {Screen} screen
 * @param {Window[]} listWin
 * @returns {Promise}
 */
function dispatchPortrait(screen, listWin) {
  const promiesAllMoves = [];
  const { titleHeight } = screen;

  for (let index = 0; index < listWin.length; index++) {
    let posX;
    let posY;
    const win = listWin[index];

    const {
      abs_x: currentX,
      abs_y: currentY,
      width: currentWidth,
      height: currentHeight,
    } = win.win_geometry;

    let mustDispatch = false;
    const even = listWin.length % 2 === 0;
    const halfSizeList = parseInt(listWin.length / 2, 10) + (even ? 0 : 1);

    const firstRow = index === 0 || index === halfSizeList;
    const firstColumn = index < halfSizeList;
    const { width, height } = genSizeWindowPortrait(screen, listWin, index);

    if (firstRow) { posY = 0; } else {
      let sumHeightPrevWindows = 0;
      for (let i = (index < halfSizeList ? 0 : halfSizeList); i < index; i++) {
        sumHeightPrevWindows += height + titleHeight;
      }
      posY = sumHeightPrevWindows + 1;
    }

    posX = firstColumn ? 0 : width;
    posX = parseInt(posX, 10);
    posY = parseInt(posY, 10);

    if (!inRange(currentX, posX - 2, posX + 2)) { mustDispatch = true; }

    if (!inRange(currentY, posY - 2, posY + 2)
        && !inRange(currentY, posY + titleHeight - 2, posY + titleHeight + 2)) {
      mustDispatch = true;
    }

    if (currentHeight !== height) { mustDispatch = true; }

    if (currentWidth !== width) { mustDispatch = true; }

    if (mustDispatch) {
      const move = placeWindow(win, width, height, posX, posY);
      move.then(() => {
        checkWindowPlacementPortrait(win, posX, posY, screen)
          .catch((error) => {
            console.error(error);
          });
      })
        .catch(console.error);
      promiesAllMoves.push(move);
    } else { // If window already placed but doesn't is hidden
      const flags = win.win_states.map((st) => st.flag);
      if (flags.includes('_NET_WM_STATE_HIDDEN')) {
        wmctrljs.activeWindowById(win.win_id)
          .catch(console.error);
      }
    }
  }

  return Promise.all(promiesAllMoves);
}

/**
 * @function maximiseOneWindow
 * @param {number} winId
 */
async function maximiseOneWindow(winId) {
  await wmctrljs.windowState(winId, 'add', 'maximized_vert', 'maximized_horz');
  await wmctrljs.activeWindowById(winId);
}

/**
 * @param {Screen} screen
 * @param {Window[]} listWin
 * @param {Function} genSizeWindow
 */
function filterAllowedWindows(screen, listWin, genSizeWindow) {
  let i = 0;
  while (i < listWin.length) {
    const win = listWin[i];
    const size = genSizeWindow(screen, listWin, i);
    if (unAuthorizedSizes(win, size.width, size.height)) {
      const types = win.win_types.map((t) => t.flag);
      if (!types.includes('_NET_WM_WINDOW_TYPE_DIALOG')) {
        wmctrljs.windowMinimize(win.win_id)
          .then(() => {
            console.log(`Window ${win.win_id} minimized`);
          })
          .catch(console.error);
      }

      listWin.splice(i, 1);
      i = 0;
    }
    i++;
  }
}

/**
 * @function dispatchWindows
 * @param {Screen} screen
 * @param {Window[]} listWin
 */
function dispatchWindows(screen, listWin) {
  if (listWin.length === 1) {
    return maximiseOneWindow(listWin[0].win_id);
  }

  if (screen.width > screen.height) {
    filterAllowedWindows(screen, listWin, genSizeWindowLandscape);
    if (listWin.length === 1) {
      return maximiseOneWindow(listWin[0].win_id);
    }
    const anchors = createAnchorListLandscape(screen, listWin.length);
    sortWindowsByAnchor(anchors, listWin);
    return dispatchLandscape(screen, listWin);
  }

  filterAllowedWindows(screen, listWin, genSizeWindowPortrait);
  if (listWin.length === 1) {
    return maximiseOneWindow(listWin[0].win_id);
  }
  const anchors = createAnchorListPortrait(screen, listWin.length);
  sortWindowsByAnchor(anchors, listWin);
  return dispatchPortrait(screen, listWin);
}

/**
 * @function placeWindows
 * @param {Window[]} [windows]
 */
async function placeWindows(list = []) {
  let windows = [];
  if (list.length === 0) {
    windows = await wmctrljs.getWindowList();
    if (windows.length === 0) { return; }
  }

  const sc = await wmctrljs.getScreen();
  const screen = {
    width: sc.width,
    height: sc.height,
    titleHeight: 28,
    listWin: windows,
  };

  await dispatchWindows(screen, windows);
}

/**
 *
 * @param {*} router
 */
function routerInit(router) {
  /**
   * @swagger
   *
   * /getwindowslist:
   *   get:
   *     description: Get window list
   *     produces:
   *     - applcation/json
   *     responses:
   *       '500':
   *         schema:
   *           $ref: '#/definitions/InternalError'
   *       '200':
   *         schema:
   *           properties:
   *             code:
   *               type: integer
   *             data:
   *               type: array
   *               items:
   *                 properties:
   *                   id:
   *                     type: integer
   *                   pid:
   *                     type: integer
   *                   wm_class:
   *                     type: string
   *                   title:
   *                     type: string
   *                   machine_name:
   *                     type: string
   */
  router.get('/getwindowslist', asyncHandler(async (_, res) => {
    const ret = { code: 200, data: [] };
    const windows = await wmctrljs.getWindowList();
    ret.data = windows.map((win) => ({
      id: win.win_id,
      pid: win.win_pid,
      wm_class: win.win_class,
      title: win.win_name,
      machine_name: win.win_client_machine,
    }));
    res.status(ret.code).send(ret);
  }));

  /**
   * @swagger
   *
   * /activatewindows:
   *   post:
   *     description: Activate windows
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *             - windowsid
   *             properties:
   *               windowsid:
   *                 type: array
   *                 items:
   *                   type: integer
   *     produces:
   *     - application/json
   *     responses:
   *       '500':
   *         schema:
   *           $ref: '#/definitions/InternalError'
   *       '200':
   *         schema:
   *           $ref: '#/definitions/Success'
   */
  router.post('/activatewindows', middlewares.get('activatewindows'), asyncHandler(async (req, res) => {
    const { windowsid = [] } = req.body;
    const ret = { code: 200, data: 'ok' };
    const awaitings = [];
    for (const windowid of windowsid) {
      awaitings.push(wmctrljs.activeWindowById(windowid));
    }
    await Promise.all(awaitings);
    res.status(ret.code).send(ret);
  }));

  /**
   * @swagger
   *
   * /closewindows:
   *   post:
   *     description: Close windows
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *             - windowsid
   *             properties:
   *               windowsid:
   *                 type: array
   *                 items:
   *                   type: integer
   *     produces:
   *       - application/json
   *     responses:
   *       '500':
   *         schema:
   *           $ref: '#/definitions/InternalError'
   *       '200':
   *         schema:
   *           $ref: '#/definitions/Success'
   */
  router.post('/closewindows', middlewares.get('closewindows'), asyncHandler(async (req, res) => {
    const { windowsid } = req.body;
    const ret = { code: 200, data: 'ok' };
    const awaitings = [];
    for (const windowid of windowsid) {
      awaitings.push(wmctrljs.closeWindowById(windowid));
    }
    await Promise.all(awaitings);
    res.status(ret.code).send(ret);
  }));

  /**
   * @swagger
   *
   * /placeAllWindows:
   *   post:
   *     description: Place and resize all windows
   *     produces:
   *     - application/json
   *     responses:
   *       '500':
   *         schema:
   *           $ref: '#/definitions/InternalError'
   *       '200':
   *         schema:
   *           $ref: '#/definitions/Success'
   */
  router.post('/placeAllWindows', asyncHandler(async (_, res) => {
    const ret = { code: 200, data: 'ok' };
    await placeWindows();
    res.status(ret.code).send(ret);
  }));
}

module.exports = { routerInit };
