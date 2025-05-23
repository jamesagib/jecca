import { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '../utils/auth';

export default function GoogleAuth({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const setError = useAuthStore((state) => state.setError);

  return (
    <TouchableOpacity 
      style={[styles.button, styles.disabled]} 
      onPress={() => {
        Alert.alert(
          'Coming Soon',
          'Google sign-in will be available in the next update!',
          [{ text: 'OK' }]
        );
      }}
    >
      <Text style={styles.buttonText}>Continue with Google (Coming Soon)</Text>
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