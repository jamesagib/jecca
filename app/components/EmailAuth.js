import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function EmailAuthForm({ email, setEmail, password, setPassword, loading, error, onSubmit, mode }) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? (mode === 'signIn' ? 'Signing in...' : 'Signing up...') : (mode === 'signIn' ? 'Sign In' : 'Sign Up')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
  },
  button: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Nunito_800ExtraBold',
  },
}); 