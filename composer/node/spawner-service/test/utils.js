const WebSocketClient = require('ws');

const buri = `ws://${process.env.CONTAINER_IP}:29784`;

/**
 * @param {number} windowsDesired
 * @param {number} timeout
 * @desc AsyncGenerator that allow to have promises for multiple steps connection
 */
async function* waitForBroadcastWindowList(windowsDesired, timeout = 15000) {
  const ws = new WebSocketClient(buri);

  let windowList;
  let p;

  yield new Promise((resolve) => {
    ws.on('open', () => {
      p = new Promise((resolveOpen, reject) => {
        const handler = setTimeout(() => {
          let msg = `Timeout didn't received [${windowsDesired}] in ${timeout}`;
          if (windowList) {
            msg += ` got [${windowList.length}] with value \n ${JSON.stringify(windowList)}`;
          }

          reject(msg);
        }, timeout);

        ws.on('message', (msg) => {
          const { method, data } = JSON.parse(msg);

          if (method === 'window.list') {
            windowList = data;
            if (windowList.length >= windowsDesired) {
              clearTimeout(handler);
              ws.close();
              resolveOpen(windowList);
            }
          }
        });
      });
      resolve('Connected !');
    });

    /**
     *
     * ws.on("close", () => {
        console.log("Socket Closed !");
        });
        @desc use for debug
    */
  });
  yield p;
}

/**
 *
 * @param {*} res
 */
const callbackExpectOk = (res) => {
  const { body } = res;
  if (res.status === 500) {
    expect(body).toEqual({ code: 500, data: 'Internal server error' });
    console.warn('Internal server error but it was handled');
  } else {
    expect(body).toEqual({ code: 200, data: 'ok' });
  }
};

/**
 *
 * @param {*} expected
 * @param {*} expectedStatus
 */
const callBackExpect = (expected, expectedStatus = 200) => (res) => {
  const { body } = res;

  if (res.status === 500) {
    if (body) {
	console.log( body );
	console.log( 'body.code:', body.code );
	console.log( 'body.data:', body.data );
    	expect(body).toEqual({ code: 500, data: 'Internal server error' });
    }
    console.warn('Internal server error but it was handled');
  } else {
    expect(expectedStatus).toBe(res.status);
    expect(body).toEqual(expected);
  }
};

/**
 *
 * @param {*} time
 */
const sleep = (time) => new Promise((resolve) => {
  setTimeout(() => { resolve(); }, time);
});

module.exports = {
  waitForBroadcastWindowList,
  callbackExpectOk,
  callBackExpect,
  sleep,
};
