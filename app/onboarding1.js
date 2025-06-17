import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import GoogleAuth from './components/GoogleAuth';
import { useAuthStore } from './utils/auth';
import EmailAuth from './components/EmailAuth';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function Onboarding1() {
  const { user, initialize } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        await initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setError('Failed to initialize. Please try again.');
      }
    };
    init();
  }, []);

  const handleAuthSuccess = (user) => {
    try {
      console.log('Successfully authenticated:', user.email);
      router.push('/onboarding2');
    } catch (error) {
      console.error('Navigation error:', error);
      setError('Failed to proceed. Please try again.');
    }
  };

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Oops!</Text>
          <Text style={styles.subtitle}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setIsInitialized(false);
              initialize();
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>welcome to the simplest app on your phone: jecca.</Text>
        <Text style={styles.subtitle}>sign in to save your reminders and sync across devices.</Text>
        
        <View style={styles.authContainer}>
          <GoogleAuth onSuccess={handleAuthSuccess} />
          <TouchableOpacity 
            style={styles.emailButton}
            onPress={() => router.push('/email-auth')}
          >
            <Text style={styles.emailButtonText}>sign in or sign up with email</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={() => router.push('/onboarding2')}
          >
            <Text style={styles.skipButtonText}>continue without signing in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Nunito_800ExtraBold',
    marginBottom: 16,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    textTransform: 'lowercase',
  },
  authContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  skipButton: {
    padding: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    textTransform: 'lowercase',
  },
  emailButton: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  emailButtonText: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    textTransform: 'lowercase',
  },
  retryButton: {
    padding: 16,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    textTransform: 'lowercase',
  },
});