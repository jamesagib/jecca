import { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '../utils/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { signInWithGoogleIdToken } from '../utils/supabaseApi';
import { trackError, trackAuthentication } from '../utils/analytics';

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
        
        // Track successful Google authentication prompt
        await trackAuthentication('google');
        
        // Use the ID token to sign in with Supabase
        const { data, error } = await signInWithGoogleIdToken(authentication.idToken);
        console.log('Supabase sign in result:', { data, error });
        
        if (error) {
          await trackError(new Error(error.message), {
            context: 'google_supabase_signin',
            auth_type: 'google'
          });
          throw new Error(error.message);
        }
        
        if (data?.user && data?.access_token) {
          setUser(data.user);
          setAccessToken(data.access_token);
          onSuccess?.(data.user);
        } else {
          const error = new Error('Invalid response from server');
          await trackError(error, {
            context: 'google_supabase_signin',
            auth_type: 'google',
            has_user: !!data?.user,
            has_token: !!data?.access_token
          });
          throw error;
        }
      } else if (result?.type === 'error') {
        const error = new Error(result.error?.message || 'Google sign in failed');
        await trackError(error, {
          context: 'google_auth_prompt',
          auth_type: 'google',
          error_type: result.error?.name
        });
        throw error;
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      setError(error.message || 'Failed to sign in with Google');
      await trackError(error, {
        context: 'google_signin',
        auth_type: 'google'
      });
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