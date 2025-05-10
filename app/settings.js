import { useState } from 'react';
import { useRef, useCallback, useMemo, useEffect } from 'react';
import { Switch, View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const TOGGLE_KEY = 'remove_reminder_toggle';

export default function SettingsModal() {
  const router = useRouter();
  const bottomSheetRef = useRef(null);
  
  const snapPoints = useMemo(() => ['25%'], []);
  
  const handleSheetChanges = useCallback((index) => {
    if (index === -1) {
      router.back();
    }
  }, [router]);
  
  useEffect(() => {
    bottomSheetRef.current?.snapToIndex(0);
  }, []);
  
  const renderBackdrop = useCallback(props => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.5}
    />
  ), []);

  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const loadToggleState = async () => {
      const storedToggle = await SecureStore.getItemAsync(TOGGLE_KEY);
      if (storedToggle !== null) {
        setIsEnabled(storedToggle === 'true');
      }
    };
    loadToggleState();
  }, []);

  const toggleSwitch = async () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    await SecureStore.setItemAsync(TOGGLE_KEY, newState.toString());
  };

  const clearAllReminders = async () => {
    await SecureStore.deleteItemAsync('reminders');
    Alert.alert('Success', 'All reminders have been cleared.');
    router.back() // Navigate to refresh tasks
  };

  return (
    <>
      {/* Screen options for transparent modal */}
      <Stack.Screen 
        options={{
          headerShown: false,
          presentation: 'transparentModal',
          animation: Platform.OS === 'ios' ? 'fade' : 'slide_from_bottom',
          contentStyle: { backgroundColor: 'transparent' },
        }} 
      />
      
      <GestureHandlerRootView style={styles.container}>
        <BottomSheet
          ref={bottomSheetRef}
          index={0}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          enablePanDownToClose={true}
          backdropComponent={renderBackdrop}
          handleIndicatorStyle={styles.handleIndicator}
          backgroundStyle={styles.sheetBackground}
          handleStyle={styles.handleStyle}
          animateOnMount={true}
          enableContentPanningGesture={true}
          enableHandlePanningGesture={true}
          android_keyboardInputMode="adjustResize"
        >
          <BottomSheetView style={styles.contentContainer}>
            <View style={styles.settingContainer}>
                <View style={styles.textContainer}>
                    <Text style={styles.settingName}>Remove reminder after completion</Text>
                    {/* <Text style={styles.settingDesc}></Text> */}
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
              style={styles.closeButton} 
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
              <Text style={styles.closeButtonText}>🗑️ Clear reminders</Text>
            </TouchableOpacity>
          </BottomSheetView>
        </BottomSheet>
      </GestureHandlerRootView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  closeButton: {
    marginTop: 'auto',
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'red',  // iOS blue
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
  }
});