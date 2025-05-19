import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';
import GoogleAuth from './components/GoogleAuth';
import { useAuthStore } from './utils/auth';
import EmailAuth from './components/EmailAuth';

export default function Onboarding1() {
  const { user, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
    // You may want to add logic here to handle auth state changes
  }, []);

  const handleAuthSuccess = (user) => {
    // If successful auth, you may want to navigate or update state
    console.log('Successfully authenticated:', user.email);
    router.push('/onboarding2');
  };

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
});