import { useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useAuthStore } from '../utils/auth';
import Constants from 'expo-constants';

// Configure Google Sign In
GoogleSignin.configure({
  iosClientId: Constants.expoConfig?.extra?.iosClientId,
  webClientId: Constants.expoConfig?.extra?.expoClientId, // Used for Android
});

export default function GoogleAuth({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      
      // Check if user is already signed in
      await GoogleSignin.signOut();
      
      // Start sign in flow
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      if (userInfo.idToken) {
        const result = await signInWithGoogle(userInfo.idToken);
        if (result && result.user) {
          onSuccess(result.user);
        }
      } else {
        console.error('No ID token present in Google Sign In response');
      }
    } catch (error) {
      console.error('Google Sign In Error:', error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the sign in flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play services not available');
      } else {
        console.error('Other error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.button, loading && styles.disabled]} 
      onPress={handleGoogleSignIn}
      disabled={loading}
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