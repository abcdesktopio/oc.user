module.exports = {
  info: {
    title: 'Spawner-service',
    version: '1.0.0',
    description: 'API used for make actions on user container',
  },
  basePath: '/spawner',
  apis: [
    './lib_spawner/router.js',
    './lib_spawner/app.js',
    './lib_spawner/audio.js',
    './lib_spawner/broadcast.js',
    './lib_spawner/clipboard.js',
    './lib_spawner/desktop.js',
    './lib_spawner/process.js',
    './lib_spawner/screen-mode.js',
    './lib_spawner/window.js',
  ],
};
