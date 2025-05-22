import { useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuthStore } from '../utils/auth';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

export default function GoogleAuth({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: Constants.expoConfig?.extra?.iosClientId,
    androidClientId: Constants.expoConfig?.extra?.androidClientId,
    webClientId: Constants.expoConfig?.extra?.expoClientId,
    useProxy: true
  });

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSignIn(response.authentication.accessToken);
    } else if (response?.type === 'error') {
      console.error('Google Sign In Response Error:', response.error);
    }
  }, [response]);

  const handleGoogleSignIn = async (accessToken) => {
    try {
      setLoading(true);
      
      if (!accessToken) {
        throw new Error('No access token received');
      }

      const result = await signInWithGoogle(accessToken);
      if (result && result.user) {
        onSuccess(result.user);
      }
    } catch (error) {
      console.error('Google Sign In Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.button, loading && styles.disabled]} 
      onPress={() => promptAsync()}
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