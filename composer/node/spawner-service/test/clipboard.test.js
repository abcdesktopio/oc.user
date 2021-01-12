const supertest = require('supertest');

const request = supertest(`http://${process.env.CONTAINER_IP}:29786`);

const { callbackExpectOk } = require('./utils');

describe('Test clipboard endpoints', () => {
  it('Shoud has response with an empty object', () => request
    .post('/spawner/clipboardsync')
    .then(callbackExpectOk));
});
