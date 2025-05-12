import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function Onboarding3() {
  const completeOnboarding = async () => {
    await SecureStore.setItemAsync('onboardingComplete', 'true');
    router.push('/tabs/today');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>turn on notifications (if you want to be reminded).</Text>
        <Text style={styles.subtitle}>last thing. if you want us to notify you when you need to complete a reminder, click "Allow notifications" below.</Text>
      </View>
      <Pressable 
        style={styles.button}
        onPress={completeOnboarding}
      >
        <Text style={styles.buttonText}>let's go</Text>
      </Pressable>
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
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
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
    fontWeight: 'bold',
  },
});