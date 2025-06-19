import 'dotenv/config';

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
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        expoClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        eas: {
          ...(config.expo?.extra?.eas || {}),
          projectId: "0be2e439-23c0-41fb-9351-824b644439c0"
        },
      },
      // Provide universal app icon so EAS generates an asset catalog
      icon: './assets/jecca.png',
      scheme: 'remra', // This is important for deep linking and must match bundle id
      ios: {
        // Explicit iOS icon (overrides universal if provided)
        icon: './assets/jecca.png',
        bundleIdentifier: 'com.webcheer.jecca',
        config: {
          googleSignIn: {
            reservedClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_RESERVED_CLIENT_ID
          }
        }
      },
      android: {
        package: 'com.webcheer.jecca',
        adaptiveIcon: {
          foregroundImage: './assets/splash-icon.png',
          backgroundColor: '#ffffff'
        }
      }
    },
  };
}; 