import { useState, useEffect } from 'react';
import { useRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { storage } from './utils/storage';
import { useAuthStore } from './utils/auth';
import { useThemeStore, getColors } from './utils/theme';

const TOGGLE_KEY = 'remove_reminder_toggle';
const TASKS_KEY = 'tasks';

export default function SettingsModal() {
  const router = useRouter();
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['35%'], []);
  const [isEnabled, setIsEnabled] = useState(false);
  const { user, signOut } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const colors = getColors(isDarkMode);

  useEffect(() => {
    if (!user) {
      router.replace('/onboarding1');
    }
  }, [user, router]);

  const handleSheetChanges = useCallback((index) => {
    if (index === -1) {
      router.back();
    }
  }, [router]);

  useEffect(() => {
    const loadToggleState = async () => {
      const storedToggle = await storage.getItem(TOGGLE_KEY);
      if (storedToggle !== null) {
        setIsEnabled(storedToggle === 'true');
      }
    };
    loadToggleState();
  }, []);

  const renderBackdrop = useCallback(
    props => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const toggleSwitch = async () => {
    try {
      const newState = !isEnabled;
      await storage.setItem(TOGGLE_KEY, newState.toString());
      setIsEnabled(newState);
    } catch (error) {
      console.error('Error toggling switch:', error);
      Alert.alert('Error', 'Failed to update setting.');
    }
  };

  const clearAllReminders = async () => {
    try {
      await storage.removeItem(TASKS_KEY);
      Alert.alert('Success', 'All reminders have been cleared.');
      router.push('/tabs/today');
    } catch (error) {
      console.error('Error clearing reminders:', error);
      Alert.alert('Error', 'Failed to clear reminders.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/onboarding1');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.modalBackground }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>settings</Text>
        
        <View style={[styles.section, { borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingText, { color: colors.text }]}>dark mode</Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.buttonBackground}
            />
            </View>
            </View>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingText, { color: colors.text }]}>Remove reminder after completion</Text>
            <Switch
              trackColor={{false: '#CFCFCF', true: '#53d769'}}
              thumbColor={isEnabled ? 'white' : 'white'}
              ios_backgroundColor="#CFCFCF"
              onValueChange={toggleSwitch}
              value={isEnabled}
            />
          </View>
          </View>
          
          <TouchableOpacity 
          style={[styles.clearButton, { backgroundColor: colors.buttonBackground }]} 
            onPress={() => {
              Alert.alert(
                'Clear All Reminders',
                'Are you sure you want to clear all reminders?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'OK', onPress: clearAllReminders },
                ]
              );
            }}
            activeOpacity={0.7}
          >
          <Text style={[styles.closeButtonText, { color: colors.buttonText }]}>Clear reminders</Text>
          </TouchableOpacity>

          <TouchableOpacity 
          style={[styles.signOutButton, { backgroundColor: colors.buttonBackground }]} 
          onPress={handleSignOut}
          >
          <Text style={[styles.signOutText, { color: colors.buttonText }]}>sign out</Text>
          </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito_800ExtraBold',
    marginBottom: 20,
  },
  section: {
    borderBottomWidth: 1,
    paddingVertical: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  settingText: {
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
  },
  clearButton: {
    marginTop: 10,
    paddingVertical: 12,
    width: '96%',
    alignItems: 'center',
    backgroundColor: 'red',
    borderRadius: 12
  },
  closeButtonText: {
    color: 'white',  
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    textTransform: 'lowercase',
  },
  signOutButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
  },
});