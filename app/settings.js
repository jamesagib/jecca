import { useState } from 'react';
import { useRef, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import * as SecureStore from 'expo-secure-store';

const TOGGLE_KEY = 'remove_reminder_toggle';
const TASKS_KEY = 'tasks';

export default function SettingsModal() {
  const router = useRouter();
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['25%'], []);
  const [isEnabled, setIsEnabled] = useState(false);

  const handleSheetChanges = useCallback((index) => {
    if (index === -1) {
      router.back();
    }
  }, [router]);

  useEffect(() => {
    const loadToggleState = async () => {
      const storedToggle = await SecureStore.getItemAsync(TOGGLE_KEY);
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
      await SecureStore.setItemAsync(TOGGLE_KEY, newState.toString());
      setIsEnabled(newState);
    } catch (error) {
      console.error('Error toggling switch:', error);
      Alert.alert('Error', 'Failed to update setting.');
    }
  };

  const clearAllReminders = async () => {
    try {
      await SecureStore.deleteItemAsync(TASKS_KEY);
      Alert.alert('Success', 'All reminders have been cleared.');
      router.push('/tabs/today');
    } catch (error) {
      console.error('Error clearing reminders:', error);
      Alert.alert('Error', 'Failed to clear reminders.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        index={0}
        style={{ flex: 1 }}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        handleStyle={styles.handleStyle}
      >
        <BottomSheetView style={styles.contentContainer}>
          <View style={styles.settingContainer}>
            <View style={styles.textContainer}>
              <Text style={styles.settingName}>Remove reminder after completion</Text>
            </View>
            <Switch
              trackColor={{false: '#CFCFCF', true: '#53d769'}}
              thumbColor={isEnabled ? 'white' : 'white'}
              ios_backgroundColor="#CFCFCF"
              onValueChange={toggleSwitch}
              value={isEnabled}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.clearButton} 
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
            <Text style={styles.closeButtonText}>Clear reminders</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => Linking.openURL('https://x.com/agibjames')}
          >
            <Text style={styles.madeWithLoveText}>made with ❤️ by James Agib</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  sheetBackground: {
    backgroundColor: 'white',
    borderTopLeftRadius: 25,  // Increased corner radius
    borderTopRightRadius: 25, // Increased corner radius
  },
  handleStyle: {
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  handleIndicator: {
    backgroundColor: '#CFCFCF',
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  contentContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ADADAD',
    marginBottom: 24,
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
  },
  settingContainer: {
    flexDirection: 'row',
    width: '95%',
    justifyContent: 'space-between'
  },
  textContainer: {
    width: '80%',
    display: 'flex',
    flexDirection: 'column',
  },
  settingName: {
    fontSize: 20,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#212121',
    lineHeight: 22
  },
  madeWithLoveText: {
    fontSize: 16,
    color: '#212121',
    textAlign: 'center',
    fontFamily: 'Nunito_800ExtraBold',
    marginTop: 8  // Add a small top margin
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
});