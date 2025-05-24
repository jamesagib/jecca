import 'dotenv/config';

export default {
  expo: {
    plugins: [
      "expo-font",
      "expo-router",
      "expo-secure-store",
      "expo-localization"
    ],
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      expoClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      eas: {
        projectId: process.env.EAS_PROJECT_ID || "0be2e439-23c0-41fb-9351-824b644439c0"
      }
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
  }
}; 