import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';

export default function Onboarding3() {
  const requestNotificationsAndComplete = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        // Even if they don't grant permission, we'll still let them use the app
        console.log('Notification permissions not granted');
      }
      await SecureStore.setItemAsync('onboardingComplete', 'true');
      router.push('/tabs/today');
    } catch (error) {
      console.error('Error requesting notifications:', error);
      // Continue with onboarding even if there's an error
      await SecureStore.setItemAsync('onboardingComplete', 'true');
      router.push('/tabs/today');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>turn on notifications (if you want to be reminded).</Text>
        <Text style={styles.subtitle}>last thing. if you want us to notify you when you need to complete a reminder, click "Allow notifications" below.</Text>
      </View>
      <View style={styles.buttonContainer}>
        <Pressable 
          style={styles.button}
          onPress={requestNotificationsAndComplete}
        >
          <Text style={styles.buttonText}>let's go</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Nunito_800ExtraBold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#666',
  },
  buttonContainer: {
    paddingBottom: 34,
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
  },
});