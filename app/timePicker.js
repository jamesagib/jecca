import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import { storage } from './utils/storage';
import moment from 'moment';

const TIME_KEY = 'selected_time';

export default function TimePicker() {
  const router = useRouter();
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['50%'], []); 
  // Initialize with current time
  const [time, setTime] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadInitialTime = async () => {
      try {
        const storedTime = await storage.getItem(TIME_KEY);
        if (storedTime) {
          const parsedTime = moment(storedTime, 'h:mma');
          if (parsedTime.isValid()) {
            setTime(parsedTime.toDate());
          }
        } else {
          // If no stored time, use current time rounded to nearest minute
          const now = new Date();
          now.setSeconds(0);
          now.setMilliseconds(0);
          setTime(now);
        }
      } catch (error) {
        console.error('Error loading time:', error);
      }
      setIsOpen(true);
    };
    loadInitialTime();
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

  const saveAndClose = async (selectedTime) => {
    try {
      const formattedTime = moment(selectedTime).format('h:mma');
      await storage.setItem(TIME_KEY, formattedTime);
      router.back();
    } catch (error) {
      console.error('Error saving time:', error);
    }
  };

  const handleTimeChange = (event, selectedDate) => {
    if (selectedDate) {
      setTime(selectedDate);
      if (Platform.OS === 'android') {
        saveAndClose(selectedDate);
      }
    }
  };

  const handlePresetTime = async (presetTimeStr) => {
    const parsedTime = moment(presetTimeStr, 'h:mma').toDate();
    setTime(parsedTime);
    await saveAndClose(parsedTime);
  };

  const WebTimePicker = () => {
    const handleWebTimeChange = async (event) => {
      const timeString = event.target.value;
      if (timeString) {
        const [hours, minutes] = timeString.split(':');
        const date = moment().hours(parseInt(hours)).minutes(parseInt(minutes)).toDate();
        setTime(date);
        await saveAndClose(date);
      }
    };

    return (
      <input
        type="time"
        onChange={handleWebTimeChange}
        value={moment(time).format('HH:mm')}
        style={{
          fontSize: '16px',
          padding: '8px',
          borderRadius: '8px',
          border: '1px solid #CFCFCF',
          backgroundColor: '#f5f5f5',
          fontFamily: 'Nunito_800ExtraBold',
          width: '120px',
          marginBottom: '20px'
        }}
      />
    );
  };

  const presetTimes = [
    '7:00am', '8:00am', '9:00am', '10:00am',
    '11:00am', '12:00pm', '1:00pm', '2:00pm',
    '3:00pm', '4:00pm', '5:00pm', '6:00pm',
    '7:00pm', '8:00pm', '9:00pm', '10:00pm'
  ];

  return (
    <GestureHandlerRootView style={styles.container}>
      <BottomSheet
        ref={bottomSheetRef}
        index={isOpen ? 0 : -1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.sheetBackground}
        handleStyle={styles.handleStyle}
      >
        <BottomSheetView style={styles.contentContainer}>
          <View style={styles.presetWrapper}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.presetContainer}
              contentContainerStyle={styles.presetContentContainer}
            >
              {presetTimes.map((timeStr) => (
                <TouchableOpacity
                  key={timeStr}
                  style={[
                    styles.presetButton,
                    moment(timeStr, 'h:mma').isSame(moment(time), 'minute') && styles.presetButtonSelected
                  ]}
                  onPress={() => handlePresetTime(timeStr)}
                >
                  <Text style={[
                    styles.presetButtonText,
                    moment(timeStr, 'h:mma').isSame(moment(time), 'minute') && styles.presetButtonTextSelected
                  ]}>
                    {timeStr}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.timePickerWrapper}>
            {Platform.OS === 'web' ? (
              <WebTimePicker />
            ) : (
              <DateTimePicker
                testID="timePicker"
                value={time}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                style={styles.timePicker}
              />
            )}
          </View>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => saveAndClose(time)}
            >
              <Text style={styles.confirmButtonText}>Set Time</Text>
            </TouchableOpacity>
          )}
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBackground: {
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
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
    padding: 16,
  },
  presetWrapper: {
    marginTop: 8,
    marginBottom: 16,
  },
  presetContainer: {
    flexGrow: 0,
  },
  presetContentContainer: {
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  presetButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  presetButtonText: {
    color: '#212121',
    fontSize: 14,
    fontFamily: 'Nunito_800ExtraBold',
    textAlign: 'center',
  },
  presetButtonSelected: {
    backgroundColor: '#212121',
  },
  presetButtonTextSelected: {
    color: 'white',
  },
  timePickerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  timePicker: {
    width: Platform.OS === 'ios' ? '100%' : 'auto',
    height: Platform.OS === 'ios' ? 200 : 'auto',
  },
  confirmButton: {
    alignSelf: 'center',
    backgroundColor: '#212121',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: '90%',
    marginBottom: 20,
    marginTop: 20,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    textAlign: 'center',
  },
});
