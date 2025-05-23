import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, Modal, Dimensions, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { storage } from './utils/storage';
import { useAuthStore } from './utils/auth';
import useSettingsStore from './store/settingsStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const TOGGLE_KEY = 'remove_reminder_toggle';

export default function SettingsScreen() {
  const router = useRouter();
  const signOut = useAuthStore(state => state.signOut);
  const [isVisible, setIsVisible] = useState(true);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  
  const removeAfterCompletion = useSettingsStore(state => state.removeAfterCompletion);
  const setRemoveAfterCompletion = useSettingsStore(state => state.setRemoveAfterCompletion);
  const loadSettings = useSettingsStore(state => state.loadSettings);

  useEffect(() => {
    loadSettings();

    // Start entrance animation
    translateY.value = withSpring(0, {
      damping: 20,
      mass: 1,
      stiffness: 100,
    });
  }, []);

  const toggleSwitch = () => {
    setRemoveAfterCompletion(!removeAfterCompletion);
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
            handleClose();
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleClose = () => {
    translateY.value = withTiming(SCREEN_HEIGHT, {
      duration: 250,
    }, () => {
      runOnJS(setIsVisible)(false);
      runOnJS(router.back)();
    });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  if (!isVisible) return null;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        <Animated.View 
          style={[
            styles.sheet,
            animatedStyle
          ]}
        >
          <View style={styles.handle} />
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
            style={styles.creditLink}
            onPress={() => Linking.openURL('https://x.com/@agibjames')}
          >
            <Text style={styles.creditText}>made with ❤️ by James Agib</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    height: SCREEN_HEIGHT * 0.43,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#CFCFCF',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
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
  creditLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  creditText: {
    fontSize: 14,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#999999',
  },
});