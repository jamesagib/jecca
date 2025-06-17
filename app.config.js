import 'dotenv/config';

export default ({
  config
}) => {
  return {
    ...config, // Preserves existing app.json configurations
    expo: {
      ...config.expo, // Preserves existing expo configurations
      name: config.expo?.name || 'jecca', // Ensure a default name
      slug: config.expo?.slug || 'jecca', // Ensure a default slug
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
      scheme: 'jecca', // This is important for deep linking
      ios: {
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