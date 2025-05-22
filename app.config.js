import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      expoClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    },
    scheme: 'jecca', // This is important for deep linking
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.webcheer.jecca',
      config: {
        googleSignIn: {
          reservedClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_RESERVED_CLIENT_ID
        }
      }
    },
    android: {
      ...config.android,
      package: 'com.webcheer.jecca',
      adaptiveIcon: {
        foregroundImage: './assets/splash-icon.png',
        backgroundColor: '#ffffff'
      }
    }
  };
}; 