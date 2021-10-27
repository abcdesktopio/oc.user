const which = require('which');

const roothomedir = '/home/balloon';
const pathVersion = '/composer/version.json';

const applist = [
  {
    key: 'xeyes.XEyes',
    path: '/usr/bin/xeyes',
  },
  {
    key: 'qterminal.qterminal',
    path: '/usr/bin/qterminal',
  },
].map((app) => {
  try {
    if (app.path[0] !== '/') {
      return {
        ...app,
        path: which.sync(app.path),
      };
    }
  } catch (e) {
    console.error(e);
  }
  return app;
});

const supportedLanguages = [
  'aa',
  'af',
  'am',
  'an',
  'ar',
  'as',
  'ast',
  'az',
  'be',
  'bem',
  'ber',
  'bg',
  'bho',
  'bn',
  'bo',
  'br',
  'bs',
  'ca',
  'crh',
  'cs',
  'csb',
  'cv',
  'cy',
  'da',
  'de',
  'dv',
  'dz',
  'el',
  'en',
  'eo',
  'es',
  'et',
  'eu',
  'fa',
  'ff',
  'fi',
  'fil',
  'fo',
  'fr',
  'fur',
  'fy',
  'ga',
  'gd',
  'gl',
  'gu',
  'gv',
  'ha',
  'he',
  'hi',
  'hne',
  'hr',
  'hsb',
  'ht',
  'hu',
  'hy',
  'ia',
  'id',
  'ig',
  'is',
  'it',
  'ja',
  'ka',
  'kk',
  'kl',
  'km',
  'kn',
  'ko',
  'ks',
  'ku',
  'kw',
  'ky',
  'lb',
  'lg',
  'li',
  'lo',
  'lt',
  'lv',
  'mai',
  'mg',
  'mhr',
  'mi',
  'mk',
  'ml',
  'mn',
  'mr',
  'ms',
  'mt',
  'my',
  'nan',
  'nb',
  'nds',
  'ne',
  'nl',
  'nn',
  'nso',
  'oc',
  'om',
  'or',
  'os',
  'pa',
  'pap',
  'pl',
  'ps',
  'pt',
  'ro',
  'ru',
  'rw',
  'sa',
  'sc',
  'sd',
  'se',
  'shs',
  'si',
  'sk',
  'sl',
  'so',
  'sq',
  'sr',
  'ss',
  'st',
  'sv',
  'sw',
  'ta',
  'te',
  'tg',
  'th',
  'ti',
  'tk',
  'tl',
  'tr',
  'ts',
  'tt',
  'ug',
  'uk',
  'ur',
  'uz',
  've',
  'vi',
  'wa',
  'wae',
  'wo',
  'xh',
  'yi',
  'yo',
  'zh-hans',
  'zh-hant',
  'zu',
];

module.exports = {
  language: 'en_US', // default language
  applist,
  roothomedir,
  supportedLanguages,
  pathVersion,
};
