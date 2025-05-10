import { useState } from 'react';
import { useRef, useCallback, useMemo, useEffect } from 'react';
import { Switch, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';

export default function SettingsModal() {
  const router = useRouter();
  const bottomSheetRef = useRef(null);
  
  // Define snap points - just one fixed height for better performance
  const snapPoints = useMemo(() => ['25%'], []);
  
  // Callbacks
  const handleSheetChanges = useCallback((index) => {
    if (index === -1) {
      // Only navigate back if sheet is closed
      router.back();
    }
  }, [router]);
  
  // Close modal handler
  const handleClose = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  // Open the sheet when component mounts
  useEffect(() => {
    // Setting initial index to 0 makes it open immediately
    bottomSheetRef.current?.snapToIndex(0);
  }, []);
  
  // Custom backdrop component
  const renderBackdrop = useCallback(props => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.5}
    />
  ), []);

  const [isEnabled, setIsEnabled] = useState(false);
  const toggleSwitch = () => setIsEnabled(previousState => !previousState);

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
              onPress={handleClose}
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