import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as SecureStore from 'expo-secure-store';
import moment from 'moment';

const TIME_KEY = 'selected_time';

export default function timePicker() {
  const router = useRouter();
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['30%'], []);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Set the time to current time when component mounts
    const currentTime = new Date();
    setTime(currentTime);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handleSheetChanges = useCallback((index) => {
    if (index === -1) {
      router.back();
    }
  }, [router]);

  const renderBackdrop = useCallback(props => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.5}
    />
  ), []);

  const saveTimeAndClose = async () => {
    const formattedTime = moment(time).format('h:mma');
    await SecureStore.setItemAsync(TIME_KEY, formattedTime);
    router.back();
  };

  return (
    <>
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
        >
          <BottomSheetView style={styles.contentContainer}>
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={saveTimeAndClose}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            )}
            <DateTimePicker
              value={time}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setTime(selectedDate);
                  if (Platform.OS === 'android') {
                    // For Android, keep the default behavior of saving and closing
                    const formattedTime = moment(selectedDate).format('h:mma');
                    SecureStore.setItemAsync(TIME_KEY, formattedTime);
                    router.back();
                  }
                }
              }}
              style={[{ width: '80%' }, Platform.OS === 'ios' && styles.iosTimePicker]}
              themeVariant="light"
              textColor="#212121"
              accentColor="#212121"
            />
          </BottomSheetView>
        </BottomSheet>
      </GestureHandlerRootView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sheetBackground: {
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  handleStyle: {
    paddingTop: 12,
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
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  iosTimePicker: {
    fontFamily: 'Nunito_800ExtraBold',
  },
  confirmButton: {
    position: 'absolute',
    top: 0,
    right: 16,
    backgroundColor: '#212121',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 1,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
