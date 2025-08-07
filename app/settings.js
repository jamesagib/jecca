import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, Modal, Dimensions, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  runOnJS,
  cancelAnimation
} from 'react-native-reanimated';
import { storage } from './utils/storage';
import useSettingsStore from './store/settingsStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const TOGGLE_KEY = 'remove_reminder_toggle';

export default function SettingsScreen() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  
  const removeAfterCompletion = useSettingsStore(state => state.removeAfterCompletion);
  const setRemoveAfterCompletion = useSettingsStore(state => state.setRemoveAfterCompletion);
  const deletePreviousDayTasks = useSettingsStore(state => state.deletePreviousDayTasks);
  const setDeletePreviousDayTasks = useSettingsStore(state => state.setDeletePreviousDayTasks);
  const loadSettings = useSettingsStore(state => state.loadSettings);

  useEffect(() => {
    loadSettings();

    // Start entrance animation
    translateY.value = withSpring(0, {
      damping: 20,
      mass: 1,
      stiffness: 100,
    });

    return () => {
      // Cleanup animations when component unmounts
      cancelAnimation(translateY);
    };
  }, []);

  const toggleSwitch = async () => {
    try {
      await setRemoveAfterCompletion(!removeAfterCompletion);
    } catch (err) {
      console.error('Failed to toggle removeAfterCompletion:', err);
    }
  };

  const toggleDeletePreviousDay = async () => {
    try {
      await setDeletePreviousDayTasks(!deletePreviousDayTasks);
    } catch (err) {
      console.error('Failed to toggle deletePreviousDayTasks:', err);
    }
  };

  const handleClose = useCallback(() => {
    translateY.value = withTiming(SCREEN_HEIGHT, {
      duration: 300,
    }, () => {
      runOnJS(() => {
        setIsVisible(false);
        router.back();
      })();
    });
  }, [router]);

  const handleResetApp = () => {
    Alert.alert(
      'Reset App',
      'This will delete all your reminders and reset the app to its initial state. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all local storage
              await storage.clear();
              // Reset onboarding
              await storage.setItem('onboardingComplete', 'false');
              handleClose();
              // Navigate to onboarding
              setTimeout(() => {
                router.replace('/onboarding3');
              }, 100);
            } catch (error) {
              console.error('Error resetting app:', error);
              Alert.alert('Error', 'Failed to reset app. Please try again.');
            }
          },
        },
      ]
    );
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
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} />
        <Animated.View style={[styles.container, animatedStyle]}>
          <View style={styles.header}>
            <Text style={styles.title}>settings</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.setting}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>remove completed reminders</Text>
                <Text style={styles.settingDescription}>
                  automatically remove reminders after you mark them as complete
                </Text>
              </View>
              <Switch
                value={removeAfterCompletion}
                onValueChange={toggleSwitch}
                trackColor={{ false: '#e0e0e0', true: '#000000' }}
                thumbColor={removeAfterCompletion ? '#ffffff' : '#ffffff'}
              />
            </View>

            <View style={styles.setting}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>delete previous day tasks</Text>
                <Text style={styles.settingDescription}>
                  automatically delete tasks from previous days to keep storage clean
                </Text>
              </View>
              <Switch
                value={deletePreviousDayTasks}
                onValueChange={toggleDeletePreviousDay}
                trackColor={{ false: '#e0e0e0', true: '#000000' }}
                thumbColor={deletePreviousDayTasks ? '#ffffff' : '#ffffff'}
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.resetButton} onPress={handleResetApp}>
              <Text style={styles.resetButtonText}>reset app</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.version}>remra v1.1.1</Text>
              <Text style={styles.copyright}>© 2024 remra</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: SCREEN_HEIGHT * 0.6,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  settingInfo: {
    flex: 1,
    marginRight: 20,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 20,
  },
  resetButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 20,
  },
  version: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 5,
  },
  copyright: {
    fontSize: 12,
    color: '#999999',
  },
});