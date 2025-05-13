import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as SecureStore from 'expo-secure-store';
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
        const storedTime = await SecureStore.getItemAsync(TIME_KEY);
        const storedRepeat = await SecureStore.getItemAsync(REPEAT_KEY);
        
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
      if (Platform.OS === 'android') {
        handleSave(selectedDate);
      }
    }
  };

  const handleSave = async (selectedTime = time) => {
    try {
      const formattedTime = moment(selectedTime).format('h:mma');
      await SecureStore.setItemAsync(TIME_KEY, formattedTime);
      await SecureStore.setItemAsync(REPEAT_KEY, repeatOption);
      router.back();
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

  const handlePresetTime = (presetTime) => {
    const parsedTime = moment(presetTime, 'h:mma').toDate();
    setTime(parsedTime);
    if (Platform.OS === 'android') {
      handleSave(parsedTime);
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
                  style={styles.presetButton}
                  onPress={() => handlePresetTime(time)}
                >
                  <Text style={styles.presetButtonText}>{time}</Text>
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
            <DateTimePicker
              testID="timePicker"
              value={time}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
              style={styles.timePicker}
            />
          </View>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => handleSave()}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
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
    marginBottom: 20
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
