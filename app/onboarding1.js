import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function Onboarding1() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>welcome to the simplest app on your phone: jecca.</Text>
        <Text style={styles.subtitle}>we're going to show you how to use the app, & don't worry, no login needed.</Text>
      </View>
      <Pressable 
        style={styles.button}
        onPress={() => router.push('/onboarding2')}
      >
        <Text style={styles.buttonText}>next</Text>
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
    fontFamily: 'Nunito_800ExtraBold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
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
    fontFamily: 'Nunito_800ExtraBold',
  },
});