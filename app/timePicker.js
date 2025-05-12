import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as SecureStore from 'expo-secure-store';
import moment from 'moment';

const TIME_KEY = 'selected_time';

export default function TimePicker() {
  const router = useRouter();
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['40%'], []);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const loadInitialTime = async () => {
      try {
        const storedTime = await SecureStore.getItemAsync(TIME_KEY);
        if (storedTime) {
          const parsedTime = moment(storedTime, 'h:mma').toDate();
          setTime(parsedTime);
        }
      } catch (error) {
        console.error('Error loading initial time:', error);
      }
    };
    
    loadInitialTime();
    // Delay the opening of the bottom sheet slightly to ensure smooth animation
    setTimeout(() => {
      bottomSheetRef.current?.snapToIndex(0);
    }, 100);
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
      pressBehavior="close"
    />
  ), []);

  const handleTimeChange = (event, selectedDate) => {
    if (selectedDate) {
      setTime(selectedDate);
      if (Platform.OS === 'android') {
        handleSave(selectedDate);
      }
    }
  };

  const handleSave = async (selectedTime = time) => {
    try {
      const formattedTime = moment(selectedTime).format('h:mma');
      await SecureStore.setItemAsync(TIME_KEY, formattedTime);
      router.back();
    } catch (error) {
      console.error('Error saving time:', error);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.sheetBackground}
        handleStyle={styles.handleStyle}
        enableContentPanningGesture={true}
        enableHandlePanningGesture={true}
      >
        <BottomSheetView style={styles.contentContainer}>
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => handleSave()}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          )}
          <DateTimePicker
            testID="timePicker"
            value={time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
            style={styles.timePicker}
          />
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent'
  },
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
  },
  timePicker: {
    width: Platform.OS === 'ios' ? '100%' : 'auto',
    height: Platform.OS === 'ios' ? 200 : 'auto',
  },
  confirmButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#212121',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
  }
});
