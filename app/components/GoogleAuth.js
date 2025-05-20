import { useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuthStore } from '../utils/auth';
import Constants from 'expo-constants';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

console.log('Expo Google OAuth redirect URI:', makeRedirectUri());

export default function GoogleAuth({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: Constants.expoConfig?.extra?.androidClientId,
    iosClientId: Constants.expoConfig?.extra?.iosClientId,
    expoClientId: Constants.expoConfig?.extra?.expoClientId,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      setLoading(true);
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken) => {
    try {
      const result = await signInWithGoogle(idToken);
      if (result && result.user) {
        onSuccess(result.user);
      }
    } catch (error) {
      console.error('Error signing in with Google:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity 
        style={[styles.button, styles.disabled]} 
        disabled={true}
      >
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>
      <View style={styles.overlay}>
        <Text style={styles.comingSoonText}>coming soon!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#4285F4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
  },
  comingSoonText: {
    color: '#000',
    fontSize: 14,
    fontFamily: 'Nunito_800ExtraBold',
    textTransform: 'lowercase',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
});