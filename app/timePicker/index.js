import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { WheelPicker } from 'react-native-wheel-picker-expo';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { storage } from '../utils/storage';
import { useThemeStore } from '../utils/theme';
import moment from 'moment';

const TIME_KEY = 'selected_time';

const generateTimeOptions = () => {
  const times = [];
  for (let hour = 1; hour <= 12; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const period = ['AM', 'PM'];
      period.forEach(p => {
        times.push(`${hour}:${minute.toString().padStart(2, '0')} ${p}`);
      });
    }
  }
  return times;
};

export default function TimePickerScreen() {
  const router = useRouter();
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['50%'], []);
  const [selectedTime, setSelectedTime] = useState(moment().format('h:mm A'));
  const { colors } = useThemeStore();
  const timeOptions = generateTimeOptions();

  useEffect(() => {
    const loadInitialTime = async () => {
      try {
        const storedTime = await storage.getItem(TIME_KEY);
        if (storedTime) {
          setSelectedTime(moment(storedTime, 'h:mma').format('h:mm A'));
        }
      } catch (error) {
        console.error('Error loading time:', error);
      }
    };
    loadInitialTime();
  }, []);

  const handleSheetChanges = useCallback((index) => {
    if (index === -1) {
      router.back();
    }
  }, [router]);

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

  const handleTimeChange = (index) => {
    setSelectedTime(timeOptions[index]);
  };

  const handleDone = async () => {
    try {
      const formattedTime = moment(selectedTime, 'h:mm A').format('h:mma');
      await storage.setItem(TIME_KEY, formattedTime);
      router.back();
    } catch (error) {
      console.error('Error saving time:', error);
    }
  };

  const presetTimes = [
    '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM',
    '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM',
    '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM',
    '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'
  ];

  const selectedIndex = timeOptions.indexOf(selectedTime);

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.modalBackground }}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
      >
        <BottomSheetView style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>pick a time</Text>
          
          <View style={[styles.pickerContainer, { backgroundColor: colors.surface }]}>
            {WheelPicker && (
              <WheelPicker
                selectedIndex={selectedIndex !== -1 ? selectedIndex : 0}
                options={timeOptions}
                onChange={handleTimeChange}
                containerStyle={{ width: '100%' }}
                itemTextStyle={[styles.pickerText, { color: colors.text }]}
                selectedStyle={{ backgroundColor: colors.primary + '20' }}
                itemHeight={44}
                haptics={true}
                renderItem={(item) => item}
              />
            )}
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.presetContainer}
            contentContainerStyle={styles.presetContent}
          >
            {presetTimes.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.presetButton,
                  { 
                    backgroundColor: selectedTime === time ? colors.primary : colors.surface,
                    borderColor: colors.border
                  }
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text
                  style={[
                    styles.presetText,
                    { 
                      color: selectedTime === time ? colors.buttonText : colors.text
                    }
                  ]}
                >
                  {time.toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.buttonBackground }]}
            onPress={handleDone}
          >
            <Text style={[styles.buttonText, { color: colors.buttonText }]}>done</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito_800ExtraBold',
    marginBottom: 20,
  },
  pickerContainer: {
    borderRadius: 10,
    marginVertical: 20,
    padding: 20,
  },
  pickerText: {
    fontSize: 20,
    fontFamily: 'Nunito_800ExtraBold',
  },
  presetContainer: {
    marginBottom: 20,
  },
  presetContent: {
    paddingHorizontal: 10,
  },
  presetButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 14,
    fontFamily: 'Nunito_800ExtraBold',
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
  },
}); 