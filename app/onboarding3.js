import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { storage } from './utils/storage';

export default function OnboardingScreen() {
  const router = useRouter();

  const completeOnboarding = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        await storage.setItem('onboardingComplete', 'true');
        router.replace('/tabs/today');
      } else {
        await storage.setItem('onboardingComplete', 'true');
        Alert.alert(
          'Notifications Disabled',
          'You can enable notifications in your device settings to receive reminders.',
          [{ text: 'OK', onPress: () => router.replace('/tabs/today') }]
        );
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      router.replace('/tabs/today');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>turn on notifications (if you want to be reminded).</Text>
        <Text style={styles.subtitle}>last thing. if you want us to notify you when you need to complete a reminder, click "Allow notifications" below.</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={completeOnboarding}
        >
          <Text style={styles.buttonText}>let's go</Text>
        </TouchableOpacity>
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
    textTransform: 'lowercase',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 34,
    left: 20,
    right: 20,
  },
  button: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    textTransform: 'lowercase',
  },
});