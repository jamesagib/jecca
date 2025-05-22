import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { storage } from './utils/storage';
import { useAuthStore } from './utils/auth';

const TOGGLE_KEY = 'remove_reminder_toggle';

export default function SettingsScreen() {
  const router = useRouter();
  const [removeAfterCompletion, setRemoveAfterCompletion] = useState(false);
  const signOut = useAuthStore(state => state.signOut);

  useEffect(() => {
    const loadSettings = async () => {
      const storedToggle = await storage.getItem(TOGGLE_KEY);
      setRemoveAfterCompletion(storedToggle === 'true');
    };
    loadSettings();
  }, []);

  const toggleSwitch = async () => {
    const newState = !removeAfterCompletion;
    setRemoveAfterCompletion(newState);
    await storage.setItem(TOGGLE_KEY, newState.toString());
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/onboarding1');
  };

  const handleClearReminders = () => {
    Alert.alert(
      "Clear All Reminders",
      "Are you sure you want to clear all reminders? This cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Clear All",
          onPress: async () => {
            await storage.removeItem('tasks');
            router.back();
          },
          style: "destructive"
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>settings</Text>
      
      <View style={styles.section}>
        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Remove reminder after completion</Text>
          <Switch
            value={removeAfterCompletion}
            onValueChange={toggleSwitch}
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.clearButton}
        onPress={handleClearReminders}
      >
        <Text style={styles.clearButtonText}>Clear reminders</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutText}>sign out</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.back()}
      >
        <Text style={styles.closeButtonText}>close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito_800ExtraBold',
    marginBottom: 20,
    color: '#000000',
  },
  section: {
    borderBottomWidth: 1,
    borderColor: '#CFCFCF',
    paddingVertical: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#000000',
  },
  clearButton: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#000000',
  },
  signOutButton: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#000000',
  },
  closeButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#000000',
  },
});