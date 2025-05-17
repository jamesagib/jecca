import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';
import GoogleAuth from './components/GoogleAuth';
import { useAuthStore } from './utils/auth';
import { supabase } from '../utils/supabase';

export default function Onboarding1() {
  const { user, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        router.push('/onboarding2');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthSuccess = (user) => {
    // If successful auth, onAuthStateChange will handle navigation
    console.log('Successfully authenticated:', user.email);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>welcome to the simplest app on your phone: jecca.</Text>
        <Text style={styles.subtitle}>sign in to save your reminders and sync across devices.</Text>
        
        <View style={styles.authContainer}>
          <GoogleAuth onSuccess={handleAuthSuccess} />
          
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
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
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
  },
});