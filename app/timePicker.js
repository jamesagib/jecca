import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import { storage } from './utils/storage';
import moment from 'moment';

const TIME_KEY = 'selected_time';
const REPEAT_KEY = 'selected_repeat';

export default function TimePicker() {
  const router = useRouter();
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['70%'], []); // Increased height for repeat options
  const [time, setTime] = useState(new Date());
  const [repeatOption, setRepeatOption] = useState('none');

  const repeatOptions = [
    { id: 'none', label: 'Once' },
    { id: 'daily', label: 'Every Day' },
    { id: 'weekdays', label: 'Weekdays' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' }
  ];

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const storedTime = await storage.getItem(TIME_KEY);
        const storedRepeat = await storage.getItem(REPEAT_KEY);
        
        if (storedTime) {
          setTime(moment(storedTime, 'h:mma').toDate());
        }
        if (storedRepeat) {
          setRepeatOption(storedRepeat);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    
    loadInitialData();
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
      // Only auto-save on Android
      if (Platform.OS === 'android') {
        handleSave(selectedDate);
      }
    }
  };

  const handlePresetTime = (presetTime) => {
    const parsedTime = moment(presetTime, 'h:mma').toDate();
    setTime(parsedTime);
    handleSave(parsedTime);
  };

  const handleSave = async (selectedTime = time) => {
    try {
      const formattedTime = moment(selectedTime).format('h:mma');
      await storage.setItem(TIME_KEY, formattedTime);
      await storage.setItem(REPEAT_KEY, repeatOption);
      
      // Close the bottom sheet first
      bottomSheetRef.current?.close();
      
      // Add a small delay before navigation to ensure smooth animation
      setTimeout(() => {
        router.replace('/tabs/tomorrow');
      }, 300);
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const presetTimes = [
    '7:00am',
    '8:00am',
    '9:00am',
    '10:00am',
    '11:00am',
    '12:00pm',
    '1:00pm',
    '2:00pm',
    '3:00pm',
    '4:00pm',
    '5:00pm',
    '6:00pm',
    '7:00pm',
    '8:00pm',
    '9:00pm',
    '10:00pm'
  ];

  const WebTimePicker = () => {
    const handleWebTimeChange = (event) => {
      const timeString = event.target.value;
      if (timeString) {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours));
        date.setMinutes(parseInt(minutes));
        setTime(date);
        handleSave(date); // Auto-save when time is changed on web
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
          <View style={styles.presetWrapper}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.presetContainer}
              contentContainerStyle={styles.presetContentContainer}
            >
              {presetTimes.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.presetButton,
                    moment(time, 'h:mma').isSame(moment(time), 'minute') && styles.presetButtonSelected
                  ]}
                  onPress={() => handlePresetTime(time)}
                >
                  <Text style={[
                    styles.presetButtonText,
                    moment(time, 'h:mma').isSame(moment(time), 'minute') && styles.presetButtonTextSelected
                  ]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.repeatOptionsContainer}>
            <Text style={styles.sectionTitle}>Repeat</Text>
            <View style={styles.repeatButtonsContainer}>
              {repeatOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.repeatButton,
                    repeatOption === option.id && styles.repeatButtonSelected
                  ]}
                  onPress={() => setRepeatOption(option.id)}
                >
                  <Text style={[
                    styles.repeatButtonText,
                    repeatOption === option.id && styles.repeatButtonTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleSave}
          >
            <Text style={styles.confirmButtonText}>Set Time</Text>
          </TouchableOpacity>
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
    justifyContent: 'center'
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
  repeatOptionsContainer: {
    width: '100%',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#212121',
    marginBottom: 8,
  },
  repeatButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  repeatButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
  },
  repeatButtonSelected: {
    backgroundColor: '#212121',
  },
  repeatButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#212121',
  },
  repeatButtonTextSelected: {
    color: 'white',
  },
});
