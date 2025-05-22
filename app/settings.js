import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { storage } from './utils/storage';
import { useAuthStore } from './utils/auth';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const TOGGLE_KEY = 'remove_reminder_toggle';

export default function SettingsScreen() {
  const router = useRouter();
  const [removeAfterCompletion, setRemoveAfterCompletion] = useState(false);
  const signOut = useAuthStore(state => state.signOut);

  // Bottom sheet setup
  const snapPoints = useMemo(() => ['50%', '75%'], []);
  const handleSheetChanges = useCallback((index) => {
    if (index === -1) {
      router.back();
    }
  }, [router]);

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
    <GestureHandlerRootView style={styles.container}>
      <BottomSheet
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        style={styles.bottomSheet}
      >
        <View style={styles.contentContainer}>
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
        </View>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  contentContainer: {
    flex: 1,
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
});