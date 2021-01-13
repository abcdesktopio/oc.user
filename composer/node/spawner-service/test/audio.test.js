const supertest = require('supertest');

const request = supertest(`http://${process.env.CONTAINER_IP}:29786`);

const { callBackExpect } = require('./utils');

describe('Test audio endpoints', () => {
  it('Should has response with forbidden on setAudioQuality', () => {
    const expected = { errors: [{ msg: 'No sink provided', param: 'sink', location: 'body' }] };
    return request
      .post('/spawner/setAudioQuality')
      .then(callBackExpect(expected, 422));
  });
});
