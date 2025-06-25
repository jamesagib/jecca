import { useState } from 'react';
import { Platform } from 'react-native';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useAuthStore } from '../utils/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import { signInWithGoogleIdToken } from '../utils/supabaseApi';

WebBrowser.maybeCompleteAuthSession();

export default function GoogleAuth({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const comingSoon = true; // TODO: flip to false when Google Sign-in is re-enabled
  const setError = useAuthStore((state) => state.setError);
  const setUser = useAuthStore((state) => state.setUser);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  // In production (App Store / TestFlight) Constants.expoConfig is stripped out, so we
  // fall back to compile-time environment variables that were injected by Metro.
  const reservedClientId =
    Constants?.expoConfig?.ios?.config?.googleSignIn?.reservedClientId ??
    process.env.EXPO_PUBLIC_GOOGLE_IOS_RESERVED_CLIENT_ID;

  const androidClientId =
    Constants.expoConfig?.extra?.androidClientId ??
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

  const iosClientId =
    Constants.expoConfig?.extra?.iosClientId ??
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  const expoClientId =
    Constants.expoConfig?.extra?.expoClientId ??
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: Constants.expoConfig?.scheme || 'remra',
    path: 'oauthredirect',
    native: reservedClientId ? `${reservedClientId}:/oauthredirect` : undefined,
  });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    redirectUri,
    androidClientId,
    iosClientId,
    expoClientId,
    responseType: "id_token",
    scopes: ['openid', 'profile', 'email'],
    extraParams: {
      access_type: 'offline',
      prompt: 'select_account',
    },
  });

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await promptAsync();
      console.log('Google auth result:', result);
      
      if (result?.type === 'success') {
        let idToken = result?.params?.id_token;

        // If the implicit flow didn't return an id_token, exchange the code for tokens
        if (!idToken && result?.params?.code) {
          const clientId = Platform.select({
            ios: iosClientId,
            android: androidClientId,
            default: expoClientId,
          });

          console.log('Exchanging auth code for tokens...');
          const tokenResult = await Google.exchangeCodeAsync({
            clientId,
            code: result.params.code,
            redirectUri,
            extraParams: {
              code_verifier: request?.codeVerifier,
            },
          });

          console.log('Token exchange result:', tokenResult);
          idToken = tokenResult?.id_token;
        }

        if (!idToken) {
          throw new Error('Unable to obtain ID token from Google');
        }

        // Use the ID token to sign in with Supabase
        const { data, error } = await signInWithGoogleIdToken(idToken);
        console.log('Supabase sign in result:', { data, error });
        
        if (error) {
          throw new Error(error.message);
        }
        
        if (data?.user && data?.access_token) {
          setUser(data.user);
          setAccessToken(data.access_token);
          onSuccess?.(data.user);
        } else {
          const error = new Error('Invalid response from server');
          throw error;
        }
      } else if (result?.type === 'error') {
        const error = new Error(result.error?.message || 'Google sign in failed');
        throw error;
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, (loading || comingSoon) && styles.disabled]}
        onPress={handleGoogleSignIn}
        disabled={loading || comingSoon || !request}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </Text>
      </TouchableOpacity>
      {comingSoon && (
        <View style={styles.blurOverlay} pointerEvents="none">
          <Text style={styles.blurText}>Coming Soon</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  blurText: {
    color: '#888',
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    textTransform: 'lowercase',
  },
  button: {
    backgroundColor: '#4285F4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    textTransform: 'lowercase',
  },
});