import { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '../utils/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { signInWithGoogleIdToken } from '../../utils/supabaseApi';

WebBrowser.maybeCompleteAuthSession();

export default function GoogleAuth({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const setError = useAuthStore((state) => state.setError);
  const setUser = useAuthStore((state) => state.setUser);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: Constants.expoConfig?.extra?.androidClientId,
    iosClientId: Constants.expoConfig?.extra?.iosClientId,
    expoClientId: Constants.expoConfig?.extra?.expoClientId,
    responseType: "id_token",
    scopes: ['profile', 'email'],
    extraParams: {
      access_type: 'offline',
      prompt: 'select_account'
    }
  });

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await promptAsync();
      console.log('Google auth result:', result);
      
      if (result?.type === 'success') {
        const { authentication } = result;
        console.log('Authentication:', authentication);
        
        // Use the ID token to sign in with Supabase
        const { data, error } = await signInWithGoogleIdToken(authentication.idToken);
        console.log('Supabase sign in result:', { data, error });
        
        if (error) throw new Error(error.message);
        
        if (data?.user && data?.access_token) {
          setUser(data.user);
          setAccessToken(data.access_token);
          onSuccess?.(data.user);
        } else {
          throw new Error('Invalid response from server');
        }
      } else if (result?.type === 'error') {
        throw new Error(result.error?.message || 'Google sign in failed');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.button, loading && styles.disabled]} 
      onPress={handleGoogleSignIn}
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