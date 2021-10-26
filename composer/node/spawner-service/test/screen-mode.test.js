const fs = require('fs');
const supertest = require('supertest');
const WebSocketClient = require('ws');

const {
  callbackExpectOk,
  callBackExpect,
} = require('./utils');

const {
  covercolor,
  colortohashstring,
} = require('../lib_spawner/covercolor.js');

const request = supertest(`http://${process.env.CONTAINER_IP}:29786`);

const buri = `ws://${process.env.CONTAINER_IP}:29784`;

describe('Test screen-mode endpoints', () => {
  const wallpapers = fs.readdirSync('/home/balloon/.wallpapers');

  describe('Tests for setBackgroundColor', () => {
    it('Should forbidden because of no color provided', () => {
      const expected = { errors: [{ location: 'body', param: 'color', msg: 'No color provided' }] };
      return request
        .post('/spawner/setBackgroundColor')
        .send({})
        .then(callBackExpect(expected, 422));
    });

    it('Should forbidden because number provided as color', () => {
      const expected = {
        errors: [{
          value: 56, location: 'body', param: 'color', msg: 'Color must be a string',
        }],
      };
      return request
        .post('/spawner/setBackgroundColor')
        .send({ color: 56 })
        .then(callBackExpect(expected, 422));
    });

    it('Should forbidden because string passed as color but not an hexa', () => {
      const expected = {
        errors: [{
          value: 'my color', location: 'body', param: 'color', msg: 'Color must be a string hexa',
        }],
      };
      return request
        .post('/spawner/setBackgroundColor')
        .send({ color: 'my color' })
        .then(callBackExpect(expected, 422));
    });

    it('Should forbidden because color provided as hexa without #', () => {
      const expected = {
        errors: [{
          value: '000000', location: 'body', param: 'color', msg: 'Bad color hexa pattern',
        }],
      };
      return request
        .post('/spawner/setBackgroundColor')
        .send({ color: '000000' })
        .then(callBackExpect(expected, 422));
    });

    it('Should change background color', () => {
      const color = '#000000';
      return request
        .post('/spawner/setBackgroundColor')
        .send({ color })
        .then(callbackExpectOk);
    });

    it('Should change background color and get an webSocket event', () => {
      const color = '#000000';
      const ws = new WebSocketClient(buri);

      return new Promise(async (resolve, reject) => {
        try {
          ws.on('message', (msg) => {
            const { method, data } = JSON.parse(msg);
            if (method === 'display.setBackgroundBorderColor') {
              expect(data).toBe(color);
              ws.close();
              resolve();
            }
          });
          await request
            .post('/spawner/setBackgroundColor')
            .send({ color })
            .then(callbackExpectOk);
        } catch (error) {
          reject(error);
        }
      });
    }, 20000);
  });

  describe('Tests for setBackgroundImage', () => {
    it('Should forbidden because of no imageName provided', () => {
      const expected = { errors: [{ location: 'body', param: 'imgName', msg: 'No imgName provided' }] };
      return request
        .post('/spawner/setBackgroundImage')
        .send({})
        .then(callBackExpect(expected, 422));
    });

    it('Should forbidden because of imageName provided as number', () => {
      const expected = {
        errors: [{
          value: 54, location: 'body', param: 'imgName', msg: 'imgName must be a string',
        }],
      };
      return request
        .post('/spawner/setBackgroundImage')
        .send({ imgName: 54 })
        .then(callBackExpect(expected, 422));
    });

    for (const imgName of wallpapers) {
      it(`Should change background image and check the expected color for img [${imgName}]`, async () => {
        const color = await covercolor(`/home/balloon/.wallpapers/${imgName}`);
        const col = colortohashstring(color);
        const expected = { code: 200, data: { color: col, subData: 'ok' } };
	console.log( `using wallpaper file /home/balloon/.wallpapers/${imgName}` );
        return request
          .post('/spawner/setBackgroundImage')
          .send({ imgName })
          .then(callBackExpect(expected));
      }, 20000);
    }

    for (const imgName of wallpapers) {
      it(`Should change background image and check the expected color and broadcastevent for [${imgName}]`, () => {
        const ws = new WebSocketClient(buri);
        return new Promise(async (resolve, reject) => {
          try {
            const color = await covercolor(`/home/balloon/.wallpapers/${imgName}`);
            const col = colortohashstring(color);
            const expected = { code: 200, data: { color: col, subData: 'ok' } };
            ws.on('message', (msg) => {
              const { method, data } = JSON.parse(msg);
              if (method === 'display.setBackgroundBorderColor') {
                expect(data).toBe(col);
                ws.close();
                resolve();
              }
            });

            await request
              .post('/spawner/setBackgroundImage')
              .send({ imgName })
              .then(callBackExpect(expected));
          } catch (error) {
            reject(error);
          }
        });
      }, 20000);
    }
  });

  describe('Tests for setDefaultImage', () => {
    beforeAll(() => { // Remove the current wallpaper builded by the previous setBackgroundImage
      fs.unlinkSync('/home/balloon/.config/current_wallpaper');
    });

    it('Should get a not found', () => {
      const expected = { code: 404, data: 'file not found' };
      return request
        .post('/spawner/setDefaultImage')
        .then(callBackExpect(expected, 404));
    });

    for (const imgName of wallpapers) {
      it(`Should setDefaultImage for img [${imgName}]`, async () => {
        const color = await covercolor(`/home/balloon/.wallpapers/${imgName}`);
        const col = colortohashstring(color);
        const expected = { code: 200, data: { color: col, subData: 'ok' } };

        await request
          .post('/spawner/setBackgroundImage')
          .send({ imgName })
          .then(callBackExpect(expected));

        await request
          .post('/spawner/setDefaultImage')
          .then(callBackExpect(expected));
      }, 20000);
    }

    for (const imgName of wallpapers) {
      it(`Should setDefaultImage and check broadcast event for img [${imgName}]`, () => {
        const ws = new WebSocketClient(buri, {
          host: process.env.CONTAINER_IP,
        });

        return new Promise(async (resolve, reject) => {
          try {
            const color = await covercolor(`/home/balloon/.wallpapers/${imgName}`);
            const col = colortohashstring(color);
            const expected = { code: 200, data: { color: col, subData: 'ok' } };

            await request
              .post('/spawner/setBackgroundImage')
              .send({ imgName })
              .then(callBackExpect(expected));

            ws.on('message', (msg) => {
              const { method, data } = JSON.parse(msg);
              if (method === 'display.setBackgroundBorderColor') {
                expect(data).toBe(col);
                ws.close();
                resolve();
              }
            });

            await request
              .post('/spawner/setDefaultImage')
              .then(callBackExpect(expected));
          } catch (e) {
            reject(e);
          }
        });
      }, 20000);
    }
  });
});
