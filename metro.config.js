const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

// Add support for Node.js core modules
config.resolver.extraNodeModules = {
  stream: require.resolve('stream-browserify'),
  crypto: require.resolve('crypto-browserify'),
  http: require.resolve('stream-http'),
  https: require.resolve('https-browserify'),
  os: require.resolve('os-browserify/browser'),
  url: require.resolve('url'),
  assert: require.resolve('assert'),
  fs: false,
  path: false,
  zlib: false,
  net: false,
  tls: false,
};

module.exports = config;