import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { storage } from './utils/storage';

export default function OnboardingScreen() {
  const router = useRouter();

  const completeOnboarding = async () => {
    try {
      console.log('Completing onboarding...');
      
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('Notification permission status:', status);
      
      if (status === 'granted') {
        await storage.setItem('onboardingComplete', 'true');
        console.log('Onboarding marked complete, navigating to today');
        router.replace('/tabs/today');
      } else {
        await storage.setItem('onboardingComplete', 'true');
        console.log('Onboarding marked complete (no notifications), navigating to today');
        Alert.alert(
          'Notifications Disabled',
          'You can enable notifications in your device settings to receive reminders.',
          [{ text: 'OK', onPress: () => {
            console.log('Alert dismissed, navigating to today');
            router.replace('/tabs/today');
          }}]
        );
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      await storage.setItem('onboardingComplete', 'true');
      console.log('Onboarding marked complete (error), navigating to today');
      router.replace('/tabs/today');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>welcome to remra</Text>
        <Text style={styles.subtitle}>the simplest reminder app on your phone</Text>
        
        <View style={styles.features}>
          <Text style={styles.feature}>• create reminders for today and tomorrow</Text>
          <Text style={styles.feature}>• get notified at the perfect time</Text>
          <Text style={styles.feature}>• everything stays on your device</Text>
          <Text style={styles.feature}>• no accounts, no sync, just reminders</Text>
        </View>
        
        <TouchableOpacity style={styles.button} onPress={completeOnboarding}>
          <Text style={styles.buttonText}>get started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
  },
  features: {
    marginBottom: 60,
  },
  feature: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#000000',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});