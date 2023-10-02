const supertest = require('supertest');
const fs = require('fs');
const { roothomedir } = require('../global-values');
const request = supertest(`http://${process.env.CONTAINER_IP}:29786`);

const {
  callbackExpectOk,
  callBackExpect,
} = require('./utils');

describe('Test desktop endpoints', () => {
  describe('Test endpoint setDesktop', () => {
    it('Should has response with forbidden because of no key and no value provided ', () => {
      const errorOne = { param: 'key', location: 'body', msg: 'No key provided' };
      const errorTwo = { param: 'value', location: 'body', msg: 'No value provided' };
      const expected = { errors: [errorOne, errorTwo] };
      return request
        .post('/spawner/setDesktop')
        .send({})
        .then(callBackExpect(expected, 422));
    });

    it('Should has response with forbidden because of key not valid and no value provided', () => {
      const errorKeyOne = {
        value: 26, param: 'key', location: 'body', msg: 'Key must be a string',
      };
      const errorKeyTwo = {
        value: null, param: 'key', location: 'body', msg: 'No key provided',
      };
      const errorValue = { param: 'value', location: 'body', msg: 'No value provided' };
      const expectedOne = { errors: [errorKeyOne, errorValue] };
      const expectedTwo = { errors: [errorKeyTwo, errorValue] };

      return Promise.all([
        request
          .post('/spawner/setDesktop')
          .send({ key: 26 })
          .then(callBackExpect(expectedOne, 422)),
        request
          .post('/spawner/setDesktop')
          .send({ key: null })
          .then(callBackExpect(expectedTwo, 422)),
      ]);
    });

    it('Should has response with forbidden because of no value provided', () => {
      const expected = { errors: [{ param: 'value', location: 'body', msg: 'No value provided' }] };
      return request
        .post('/spawner/setDesktop')
        .send({ key: 'my_test_key' })
        .then(callBackExpect(expected, 422));
    });

   
    it('Should has response with forbidden because of invalid path test 1', () => {
      const expected = { code: 404, data: 'Not found' };
      return request
        .post('/spawner/setDesktop')
        .send({ key: '../../../../../../../../../../tmp/testfile', value: 'dummy' })
        .then(callBackExpect(expected, 404 ));
    });

    it('Should has response with forbidden because of invalid path test 2', () => {
      const expected = { code: 404, data: 'Not found' };
      return request
        .post('/spawner/setDesktop')
        .send({ key: '~/../../../../../../../../../../var/log/desktop/testfile', value: 'dummy' })
	.then(callBackExpect(expected,404));
    });

    it('Should has response with success', () => request
      .post('/spawner/setDesktop')
      .send({ key: 'superfile', value: 'superdata' })
      .expect(callbackExpectOk));

    it('Should has response with success', () => request
      .post('/spawner/setDesktop')
      .send({ key: 'my_test_key', value: 'my_test_value' })
      .expect(callbackExpectOk));
  });

  describe('Test endpoint getDesktop', () => {
    describe('Test with key provided as not string', () => {
      it('Should forbidden because of null', () => {
        const expected = {
          errors: [{
            value: '', msg: 'Key must not be empty', param: 'key', location: 'query',
          }],
        }; // value null is received as empty
        return request.get('/spawner/getDesktop')
          .query({ key: null })
          .then(callBackExpect(expected, 422));
      });

    it('Should has response with forbidden because of key provided has invalid path test 1', () => {
      const expected = { code: 404, data: 'Not found' };
      return request
        .get('/spawner/getDesktop')
        .query({ key: '../../../../../../../../etc/passwd' })
        .then(callBackExpect(expected,404));
    });

    it('Should has response with forbidden because of key provided has invalid path test 2', () => {
      const expected = { code: 404, data: 'Not found' };
      return request
        .get('/spawner/getDesktop')
        .query({ key: '~/../../../../../../../../etc/passwd' })
        .then(callBackExpect(expected,404));
    });

    it('Should has response with forbidden because of key provided has invalid path test 3', () => {
      const expected = { code: 404, data: 'Not found' };
      return request
        .get('/spawner/getDesktop')
        .query({ key: '~/../../../../../../../../tmp/.X0-lock' })
        .then(callBackExpect(expected,404));
    });

    it('Should has response with forbidden because of key provided has invalid path test 4', () => {
      const expected = { code: 404, data: 'Not found' };
      return request
        .get('/spawner/getDesktop')
        .query({ key: '~/../../../../../../../../var/log/desktop/xserver.log' })
        .then(callBackExpect(expected,404));
    });


      it('Should forbidden because of empty', () => {
        const expected = {
          errors: [{
            value: '', msg: 'Key must not be empty', param: 'key', location: 'query',
          }],
        };
        return request.get('/spawner/getDesktop')
          .query({ key: '' })
          .then(callBackExpect(expected, 422));
      });

      it('Should forbidden because of only spaces', () => {
        const expected = {
          errors: [{
            value: '    ', msg: 'Key must have a valid pattern', param: 'key', location: 'query',
          }],
        };
        return request.get('/spawner/getDesktop')
          .query({ key: '    ' })
          .then(callBackExpect(expected, 422));
      });
    });

    describe('Test with key provided as unknow values', () => {
      const expected = { code: 404, data: 'Not found' };
      it('Should forbidden because of [unknow]', () => request.get('/spawner/getDesktop')
        .query({ key: 'unknow' })
        .then(callBackExpect(expected, 404)));

      it('Should forbidden because of [data]', () => request.get('/spawner/getDesktop')
        .query({ key: 'data' })
        .then(callBackExpect(expected, 404)));

      it('Should forbidden because of [not there]', () => request.get('/spawner/getDesktop')
        .query({ key: 'not there' })
        .then(callBackExpect(expected, 404)));
    });

    it('Should has response with forbidden because of no key provided', () => {
      const expected = { errors: [{ msg: 'No key provided', param: 'key', location: 'query' }] };
      return request
        .get('/spawner/getDesktop')
        .then(callBackExpect(expected, 422));
    });

    it('Should has reponse with previous provided key, value', () => {
      const expected = { code: 200, data: 'my_test_value' };
      return request
        .get('/spawner/getDesktop')
        .query({ key: 'my_test_key' })
        .then(callBackExpect(expected));
    });
  });

  describe('Test endpoint filesearch', () => {
    it('Should respond with forbidden because of no keywords provided', () => {
      const expected = { errors: [{ msg: 'No keywords provided', param: 'keywords', location: 'query' }] };
      return request
        .get('/spawner/filesearch')
        .query({ maxfile: 64 })
        .then(callBackExpect(expected, 422));
    });

    it('Should respond with forbidden because of maxfile with 0', () => {
      const expected = {
        errors: [
          {
            value: '0',
            msg: 'Maxfile must be a strictly positive number',
            param: 'maxfile',
            location: 'query',
          },
        ],
      };

      return request
        .get('/spawner/filesearch')
        .query({ maxfile: '0', keywords: 'file' })
        .then(callBackExpect(expected, 422));
    });

    it('Should provide file created', () => {
      fs.writeFileSync(`${roothomedir}/test`, 'TEST');
      const expected = {
        code: 200,
        data: [
          {
            file: `${roothomedir}/test`,
            mime: false,
          },
        ],
      };
      return request
        .get('/spawner/filesearch')
        .query({ keywords: 'test' })
        .then(callBackExpect(expected));
    });

    const walpapersPath = `${roothomedir}/.wallpapers`;
    for (const [index, file] of fs.readdirSync(walpapersPath).entries()) {
      const newFilename = `${index}.jpg`;
      const filePath = `${walpapersPath}/${file}`;
      const newPath = `${roothomedir}/${newFilename}`;
      fs.copyFileSync(filePath, newPath);
      it(`Should get path and mime for file [${file}]`, () => {
        const expected = { code: 200, data: [{ file: newPath, mime: 'image/jpeg' }] };
        return request
          .get('/spawner/filesearch')
          .query({ keywords: newFilename })
          .then(callBackExpect(expected));
      });
    }
  });

  describe('Test endpoint getappforfile', () => {
    it('Should has response with forbidden because of no filename prvided', () => {
      const expected = { errors: [{ msg: 'No filename provided', param: 'filename', location: 'query' }] };
      return request
        .get('/spawner/getappforfile')
        .then(callBackExpect(expected, 422));
    });
  });
});
