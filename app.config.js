module.exports = ({
  config
}) => {
  // Ensure config.expo and config.expo.plugins exist
  if (!config.expo) {
    config.expo = {};
  }
  if (!config.expo.plugins) {
    config.expo.plugins = [];
  }

  // Remove the custom Podfile patch plugin — New Arch no longer needs it and it
  // breaks with modular headers.
  // config.expo.plugins.push('./plugins/withUseModularHeaders.js');
  config.expo.plugins.push('./plugins/withReactJsinspectorModularHeaders.js');

  return {
    ...config, // Preserves existing app.json configurations
    expo: {
      ...config.expo, // Preserves existing expo configurations
      name: config.expo?.name || 'remra', // Ensure a default name
      slug: config.expo?.slug || 'remra', // Ensure a default slug
      extra: {
        ...config.expo?.extra, // Preserves other existing extra configurations
        eas: {
          ...(config.expo?.extra?.eas || {}),
          projectId: "a2bef493-163f-47bd-8206-455ebfb93681"
        },
      },
      // Provide universal app icon so EAS generates an asset catalog
      icon: './assets/jecca.png',
      scheme: 'remra', // This is important for deep linking and must match bundle id
      ios: {
        // Explicit iOS icon (overrides universal if provided)
        icon: './assets/jecca.png',
        bundleIdentifier: 'com.webcheer.jecca',
      },
      android: {
        package: 'com.webcheer.jecca',
        adaptiveIcon: {
          foregroundImage: './assets/splash-icon.png',
          backgroundColor: '#ffffff'
        }
      },
      // Disable new React Runtime to avoid conflicts
      experiments: {
        tsconfigPaths: true
      }
    }
  };
}; 