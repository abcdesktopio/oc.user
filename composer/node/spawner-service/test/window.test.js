const wmctrljs = require('wmctrljs');
const supertest = require('supertest');

const request = supertest(`http://${process.env.CONTAINER_IP}:29786`);
const {
  waitForBroadcastWindowList,
  callbackExpectOk,
  callBackExpect,
} = require('./utils');

const nbrWindow = 5;

function middlewareWindowsid(endpoint) {
  it('Should forbidden because of no windowsid provided', () => {
    const expected = { errors: [{ param: 'windowsid', location: 'body', msg: 'No windowsid provided' }] };
    return request
      .post(`/spawner/${endpoint}`)
      .send({})
      .then(callBackExpect(expected, 422));
  });

  it('Should forbidden because of string provided as windowsid', () => {
    const expected = {
      errors: [{
        value: '', param: 'windowsid', location: 'body', msg: 'Windowsid must be an array of windowid not empty',
      }],
    };
    return request
      .post(`/spawner/${endpoint}`)
      .send({ windowsid: '' })
      .then(callBackExpect(expected, 422));
  });

  it('Should forbidden because of empty array provided as windowsid', () => {
    const expected = {
      errors: [{
        value: [], param: 'windowsid', location: 'body', msg: 'Windowsid must be an array of windowid not empty',
      }],
    };
    return request
      .post(`/spawner/${endpoint}`)
      .send({ windowsid: [] })
      .then(callBackExpect(expected, 422));
  });

  it('Should forbidden because of array not filled with numbers is provided as windowsid', () => {
    const expected = {
      errors: [{
        value: [789, 'ddfc'], param: 'windowsid', location: 'body', msg: 'All windowsid must be number',
      }],
    };
    return request
      .post(`/spawner/${endpoint}`)
      .send({ windowsid: [789, 'ddfc'] })
      .then(callBackExpect(expected, 422));
  });

  it("Should forbidden because of an unknow window's id", () => {
    const expected = {
      errors: [{
        value: [-100], param: 'windowsid', location: 'body', msg: 'Unknow window_id [-100]',
      }],
    };
    return request
      .post(`/spawner/${endpoint}`)
      .send({ windowsid: [-100] })
      .then(callBackExpect(expected, 422));
  });
}

describe('Test window endpoints', () => {
  describe('Test endpoint activateWindows', () => {
    let frontWindows;
    middlewareWindowsid('activatewindows');

    beforeAll(async () => {
      const asyncIterator = waitForBroadcastWindowList(1);
      await asyncIterator.next();
      await request
        .post('/spawner/exec')
        .send({ cmd: 'xeyes' })
        .then(callbackExpectOk);

      const { value } = await asyncIterator.next();
      frontWindows = value;
    }, 10000);

    it('Should activatewindow', () => request
      .post('/spawner/activatewindows')
      .send({ windowsid: frontWindows.map((w) => w.id) })
      .then(callbackExpectOk));

    afterAll(async () => {
      await request
        .post('/spawner/closewindows')
        .send({ windowsid: frontWindows.map((w) => w.id) })
        .then(callbackExpectOk);
    });
  });

  describe('Test endpoint closewindows', () => {
    let frontWindows;
    middlewareWindowsid('closewindows');
    beforeAll(async () => {
      const asyncIterator = waitForBroadcastWindowList(1);
      await asyncIterator.next(); // Wait for connection on broadcast
      await request
        .post('/spawner/exec')
        .send({ cmd: 'xeyes' })
        .then(callbackExpectOk);

      const { value } = await asyncIterator.next(); // Wait for broadcast event and get windows
      frontWindows = value;
    });

    it('Should closewindow', () => request
      .post('/spawner/closewindows')
      .send({ windowsid: frontWindows.map((w) => w.id) })
      .then(callbackExpectOk), 20000);

    it('Should open and close lot of windows', async () => {
      const asyncIterator = waitForBroadcastWindowList(nbrWindow);
      await asyncIterator.next(); // Wait for connection on broadcast
      for (let i = 0; i < nbrWindow; i++) {
        await request
          .post('/spawner/exec')
          .send({ cmd: 'xeyes' })
          .then(callbackExpectOk);
      }
      const { value } = await asyncIterator.next(); // Wait for broadcast event and get windows
      const windowsid = value.map((w) => w.id);

      return request
        .post('/spawner/closewindows')
        .send({ windowsid })
        .then(callbackExpectOk);
    }, 30000);
  });

  describe('Test endpoint placeAllWindows', () => {
    let frontWindows;

    beforeAll(async () => {
      const asyncIterator = waitForBroadcastWindowList(nbrWindow);
      await asyncIterator.next(); // Wait for connection on broadcast
      for (let i = 0; i < nbrWindow; i++) {
        await request
          .post('/spawner/exec')
          .send({ cmd: 'xeyes' })
          .then(callbackExpectOk);
      }
      const { value } = await asyncIterator.next(); // Wait for broadcast event and get windows
      if (value) {
        frontWindows = value;
      }
    }, 30000);

    it('Should place all windows', () => request
      .post('/spawner/placeAllWindows')
      .then(callbackExpectOk));

    afterAll(async () => {
      const windows = frontWindows || await wmctrljs.getWindowList();
      await request
        .post('/spawner/closewindows')
        .send({ windowsid: windows.map((w) => w.id) })
        .then(callbackExpectOk);
    });
  });
});
