const os = require('os');
const fs = require('fs');
const supertest = require('supertest');
const { callBackExpectOnly, callBackExpect } = require('./utils');
const request = supertest(`http://${process.env.CONTAINER_IP}:29786`);


/**
 *
 * @param {*} expected
 * @param {*} expectedStatus
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
    expectedkeys = Object.keys(expected);
    expect(body).toEqual(expected);
  }
};
 */

describe('Test process endpoints', () => {
  it('Should has response with about', () => {
    const expected = {
      hostname: os.hostname(),
      ipaddr: os.networkInterfaces().eth0[0].address,
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      cpu: os.cpus()[0].model,
      country: 'default value',
      language: 'en_US',
      build: fs.readFileSync('/etc/build.date', 'utf8'),
    };

    return request
      .get('/spawner/about')
      .then(callBackExpectOnly(expected));
  });
});
