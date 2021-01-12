/* eslint-disable no-restricted-globals */
const supertest = require('supertest');
const fs = require('fs');

const request = supertest(`http://${process.env.CONTAINER_IP}:29786`);

const { applist } = require('/composer/node/spawner-service/global-values');

describe('Test app endpoints', () => {
  for (const { key, path } of applist) {
    const progName = key.split('.')[0];
    it(`Should run ${progName}`, () => request
      .post('/spawner/launch')
      .send({ command: key })
      .then(({ body }) => {
        const { code, data, proc } = body;
        if (code !== 200) {
          throw new Error(`Expect 200 as cod but got ${code}`);
        }

        if (!(data instanceof Object)) {
          throw new Error(`Expect an object as data but got ${data}`);
        }

        if (!(proc instanceof Object)) {
          throw new Error(`Expect an object as proc but got ${proc}`);
        }

        if (isNaN(proc.pid)) {
          throw new Error(`Expect a number as pid but got ${proc.pid}`);
        }

        const { command, args } = data;

        if (command !== path) {
          throw new Error(`Expect a string '${path}' as command but got ${command}`);
        }

        if (!(args instanceof Array) || args.length !== 0) {
          throw new Error(`Expect an empty array as args but got ${args}`);
        }

        return request.post('/spawner/kill')
          .send({ pid: proc.pid })
          .expect(200)
          .expect({ code: 200, data: 'ok' });
      }));

    it(`Should run ${progName} with forbidden because of args as string`, () => {
      const expected = {
        errors: [{
          value: 'my arg', msg: 'Args must be an array of string not empty', param: 'args', location: 'body',
        }],
      };
      return request
        .post('/spawner/launch')
        .send({ command: key, args: 'my arg' })
        .expect(422)
        .expect(expected);
    });

    it(`Should run ${progName} with forbidden because of args as number`, () => {
      const expected = {
        errors: [{
          value: 18, msg: 'Args must be an array of string not empty', param: 'args', location: 'body',
        }],
      };
      return request
        .post('/spawner/launch')
        .send({ command: key, args: 18 })
        .expect(422)
        .expect(expected);
    });

    it(`Should run ${progName} with forbidden because of args as empty array`, () => {
      const expected = {
        errors: [{
          value: [], msg: 'Args must be an array of string not empty', param: 'args', location: 'body',
        }],
      };
      return request
        .post('/spawner/launch')
        .send({ command: key, args: [] })
        .expect(422)
        .expect(expected);
    });
  }

  it('Should forbidden on run xeyes because not an handled application', () => {
    const expected = {
      errors: [{
        value: 'xeyes', msg: 'Command must be a valid handled command', param: 'command', location: 'body',
      }],
    };
    return request
      .post('/spawner/launch')
      .send({ command: 'xeyes' })
      .expect(422)
      .expect(expected);
  });
});
