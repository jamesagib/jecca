module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'react',
        }
      ]
    ],
    plugins: [
      '@babel/plugin-transform-template-literals',
      'react-native-reanimated/plugin',
      '@babel/plugin-proposal-export-namespace-from',
    ],
  };
};