const supertest = require('supertest');
const fs = require('fs');

const pathVersion = '/composer/version.json';

const request = supertest(`http://${process.env.CONTAINER_IP}:29786`);

const { callBackExpect } = require('./utils');

describe('Test main spawner endpoints', () => {
  it('Shoud has data equals to version.json content', () => {
    const expectedJSON = fs.readFileSync(pathVersion, 'utf8');
    const expected = { code: 200, data: JSON.parse(expectedJSON) };

    return request
      .get('/spawner/version')
      .then(callBackExpect(expected));
  });
});
