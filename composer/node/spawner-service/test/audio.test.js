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


  describe('Test configurePulse endpoint', () => {
    it('Should has response with forbidden because of no parameters provided', () => {
      const expected = {
        errors: [
          {
            msg: 'No destinationIp provided',
            param: 'destinationIp',
            location: 'body'
          },
          {
            msg: 'No port provided',
            param: 'port',
            location: 'body'
          },
        ],
      };

      return request
        .put('/spawner/configurePulse')
        .then(callBackExpect(expected, 422));
    });

    it('Should has response with forbidden because of no port provided', () => {
      const expected = {
        errors: [
          {
            msg: 'No port provided',
            param: 'port',
            location: 'body'
          },
        ],
      };

      return request
        .put('/spawner/configurePulse')
        .send({ destinationIp: '8.8.8.8' })
        .then(callBackExpect(expected, 422));
    });
  });
});
