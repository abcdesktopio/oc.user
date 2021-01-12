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

const supertest = require('supertest');
const fs = require('fs');

const request = supertest(`http://${process.env.CONTAINER_IP}:29783`);

const uploadFinaleName = 'uploaded.data.txt';
const uploadFinaleNameTwo = 'uploaded.data.2.txt';
const pathOnHost = `/home/balloon/.wallpapers/${uploadFinaleName}`;
describe('Test file-service', () => {
  beforeAll(() => {
    fs.writeFileSync('/tmp/uploaded.txt', 'Yet another test file');
    fs.writeFileSync('/tmp/uploaded.2.txt', 'Yet another test file');
  });

  describe('Test Uploadfile', () => {
    it('Should get forbidden because of no file provided', () => {
      const expected = { errors: [{ location: 'request', msg: 'No file provided' }] };
      return request
        .post('/filer')
        .send({})
        .expect(422)
        .expect(expected);
    });

    it('Should upload a file in folder .wallpapers', () => {
      const expected = { code: 200, data: 'ok' };
      return request
        .post('/filer')
        .field('fullPath', '/home/balloon/.wallpapers')
        .attach('file', fs.readFileSync('/tmp/uploaded.txt'), uploadFinaleName)
        .expect(200)
        .expect(expected);
    });

    it('Should upload a file in home directory', () => {
      const expected = { code: 200, data: 'ok' };
      return request
        .post('/filer')
        .attach('file', fs.readFileSync('/tmp/uploaded.2.txt'), uploadFinaleNameTwo)
        .expect(200)
        .expect(expected);
    });
  });

  describe('Test Downloadfile', () => {
    it('Should get forbidden because of param not provided [file]', () => {
      const expected = { errors: [{ location: 'query', msg: 'No file provided', param: 'file' }] };
      return request
        .get('/filer')
        .query({})
        .expect(422)
        .expect(expected);
    });

    it('Should get forbidden because [file] provided as null', () => {
      const expected = {
        errors: [{
          value: '', location: 'query', msg: 'file must not be empty', param: 'file',
        }],
      };
      return request
        .get('/filer')
        .query({ file: null })
        .expect(422)
        .expect(expected);
    });

    it('Should get forbidden because [file] provided as empty', () => {
      const expected = {
        errors: [{
          value: '', location: 'query', msg: 'file must not be empty', param: 'file',
        }],
      };
      return request
        .get('/filer')
        .query({ file: '' })
        .expect(422)
        .expect(expected);
    });

    it('Should download the uploaded file', () => request
      .get('/filer')
      .query({ file: pathOnHost })
      .expect(200));
  });

  describe('Test list directory', () => {
    it('Should list all files in wallpapers directory', () => request
      .get('/filer/directory/list')
      .query({ directory: '/home/balloon/.wallpapers' })
      .expect(200));

    it('Should get not found', () => request
      .get('/filer/directory/list')
      .query({ directory: '/home/balloon/directoryWichDoesnotExist' })
      .expect(404)
      .expect({ code: 404, data: 'Not found' }));

    it('Should get forbiden because of file provided is not a directory', () => {
      const [file] = fs.readdirSync('/home/balloon/.wallpapers');
      const directory = `/home/balloon/.wallpapers/${file}`;
      const expected = { code: 403, data: `${directory} is not a directory` };
      return request
        .get('/filer/directory/list')
        .query({ directory })
        .expect(expected);
    });
    it('Should get 422 error because of directory not provided', () => request.get('/filer/directory/list')
      .expect(422)
      .expect({ errors: [{ location: 'query', msg: 'No directory provided', param: 'directory' }] }));

    it('Should get 422 error because of directory provided as empty', () => request.get('/filer/directory/list')
      .query({ directory: '' })
      .expect(422)
      .expect({
        errors: [{
          location: 'query',
          msg: 'directory must not be empty',
          param: 'directory',
          value: '',
        }],
      }));
  });

  describe('Test Deletefile', () => {
    it('Should get forbidden because of not provided [file]', () => {
      const expected = { errors: [{ location: 'body', msg: 'No file provided', param: 'file' }] };
      return request
        .delete('/filer')
        .send({})
        .expect(422)
        .expect(expected);
    });

    it('Should get forbidden because file provided as null', () => {
      const expected = {
        errors: [{
          value: null, location: 'body', msg: 'No file provided', param: 'file',
        }],
      };
      return request
        .delete('/filer')
        .send({ file: null })
        .expect(422)
        .expect(expected);
    });

    it('Should get forbidden because file provided as empty', () => {
      const expected = {
        errors: [{
          value: '', location: 'body', msg: 'file must not be empty', param: 'file',
        }],
      };
      return request
        .delete('/filer')
        .send({ file: '' })
        .expect(422)
        .expect(expected);
    });

    it('Should delete the uploaded file', () => request
      .delete('/filer')
      .send({ file: pathOnHost })
      .expect(200)
      .expect({ code: 200, data: 'ok' }));

    it('Should get a 404 when trying to delete the second time', () => request
      .delete('/filer')
      .send({ file: pathOnHost })
      .expect(404)
      .expect({ code: 404, data: 'Not Found' }));
  });

  afterAll(() => {
    fs.unlinkSync('/tmp/uploaded.txt');
    fs.unlinkSync('/tmp/uploaded.2.txt');
  });
});
