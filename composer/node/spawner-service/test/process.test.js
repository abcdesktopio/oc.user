const os = require('os');
const fs = require('fs');
const supertest = require('supertest');

const request = supertest(`http://${process.env.CONTAINER_IP}:29786`);

const { callBackExpect } = require('./utils');

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
      POD_NAMESPACE: '',
      POD_NAME: '',
      NODE_NAME: '',
    };

    return request
      .get('/spawner/about')
      .then(callBackExpect(expected));
  });

  it('Shoud has response with hope key code equals to 200 and key data equals to empty array', () => {
    const expected = {
      code: 200,
      data: ['audio', 'printers'],
    };

    return request
      .get('/spawner/getSettings')
      .then(callBackExpect(expected));
  });
});
