import { useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { useAuthStore } from '../utils/auth';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

export default function GoogleAuth({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const setError = useAuthStore((state) => state.setError);

  // Log all possible redirect URIs
  console.log('=== Google Auth Configuration ===');
  console.log('1. Proxy Redirect URI:', makeRedirectUri({
    useProxy: true,
  }));
  console.log('2. Native Redirect URI:', makeRedirectUri({
    scheme: Constants.expoConfig?.scheme
  }));
  console.log('3. Bundle Identifier:', Constants.expoConfig?.ios?.bundleIdentifier);
  console.log('4. iOS Client ID:', Constants.expoConfig?.extra?.iosClientId);
  console.log('==============================');

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: Constants.expoConfig?.extra?.iosClientId,
    androidClientId: Constants.expoConfig?.extra?.androidClientId,
    webClientId: Constants.expoConfig?.extra?.expoClientId,
    redirectUri: makeRedirectUri({
      useProxy: true,
    }),
    useProxy: true,
    // Production configuration will use native URIs
    ...(Constants.appOwnership === 'standalone' && {
      redirectUri: makeRedirectUri({
        native: Platform.select({
          ios: Constants.expoConfig?.ios?.bundleIdentifier,
          android: Constants.expoConfig?.android?.package
        })
      }),
      useProxy: false
    })
  });

  useEffect(() => {
    if (response?.type === 'success') {
      console.log('Google Auth Response Success:', {
        accessToken: response.authentication.accessToken ? 'present' : 'missing',
        idToken: response.authentication.idToken ? 'present' : 'missing'
      });
      handleGoogleSignIn(response.authentication.idToken);
    } else if (response?.type === 'error') {
      console.error('Google Sign In Response Error:', response.error);
      setError('Failed to connect to Google. Please try again.');
      setLoading(false);
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!idToken) {
        throw new Error('No ID token received');
      }

      console.log('Got Google ID token, attempting Supabase sign in...');
      const result = await signInWithGoogle(idToken);
      
      if (result?.error) {
        console.error('Supabase sign in error:', result.error);
        throw new Error(result.error.message);
      }
      
      if (!result?.user) {
        throw new Error('No user data received from sign in');
      }

      console.log('Google sign in successful');
      onSuccess(result.user);
    } catch (error) {
      console.error('Google Sign In Error:', error);
      setError(error.message || 'Failed to sign in with Google. Please try again.');
      Alert.alert(
        'Sign In Error',
        error.message || 'Failed to sign in with Google. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.button, loading && styles.disabled]} 
      onPress={() => {
        setError(null);
        promptAsync();
      }}
      disabled={loading || !request}
    >
      <Text style={styles.buttonText}>
        {loading ? 'Signing in...' : 'Continue with Google'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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