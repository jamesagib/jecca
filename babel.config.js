module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          alias: {
            'stream': 'stream-browserify',
            'crypto': 'crypto-browserify',
            'http': 'stream-http',
            'https': 'https-browserify',
            'os': 'os-browserify/browser',
            'url': 'url',
            'assert': 'assert',
            'net': false,
            'tls': false,
          },
        },
      ],
    ],
  };
};