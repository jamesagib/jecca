import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from './utils/auth';

export default function EmailAuthScreen() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState('email'); // 'email' or 'code'
  const sendOtp = useAuthStore((state) => state.sendOtp);
  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const otpSent = useAuthStore((state) => state.otpSent);
  const otpEmail = useAuthStore((state) => state.otpEmail);
  const router = useRouter();

  const handleSendOtp = async () => {
    if (!email) return;
    const result = await sendOtp(email);
    if (result) setMode('code');
  };

  const handleVerifyOtp = async () => {
    if (!otpEmail || !code) return;
    const result = await verifyOtp(otpEmail, code);
    if (result && result.data && result.data.user) {
      router.push('/onboarding2');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in or Sign up with Email</Text>
      {mode === 'email' && !otpSent && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading || !email}>
            <Text style={styles.buttonText}>{loading ? 'Sending code...' : 'Send Code'}</Text>
          </TouchableOpacity>
        </>
      )}
      {(mode === 'code' || otpSent) && (
        <>
          <Text style={styles.subtitle}>Enter the code sent to {otpEmail || email}</Text>
          <TextInput
            style={styles.input}
            placeholder="6-digit code"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
            editable={!loading}
            maxLength={6}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading || !code}>
            <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify Code'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => { setMode('email'); setCode(''); }} disabled={loading}>
            <Text style={styles.secondaryButtonText}>Back to Email</Text>
          </TouchableOpacity>
        </>
      )}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        disabled={loading}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Nunito_800ExtraBold',
    marginBottom: 24,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'lowercase',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    width: 260,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    width: 260,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    textTransform: 'lowercase',
  },
  secondaryButton: {
    alignItems: 'center',
    padding: 10,
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    textTransform: 'lowercase',
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Nunito_800ExtraBold',
    textTransform: 'lowercase',
  },
  backButton: {
    alignItems: 'center',
    padding: 10,
    marginTop: 10,
  },
  backButtonText: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    textTransform: 'lowercase',
  },
}); 