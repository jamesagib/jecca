import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../utils/theme';
import { storage } from '../utils/storage';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const generateHours = () => {
  return Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
};

const generateMinutes = () => {
  return Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
};

const getCurrentTime = () => {
  const now = new Date();
  let currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentPeriod = currentHours >= 12 ? 'PM' : 'AM';
  
  // Convert to 12-hour format
  if (currentHours > 12) {
    currentHours -= 12;
  } else if (currentHours === 0) {
    currentHours = 12;
  }
  
  return {
    hours: currentHours.toString().padStart(2, '0'),
    minutes: currentMinutes.toString().padStart(2, '0'),
    period: currentPeriod
  };
};

export default function Page() {
  const router = useRouter();
  const { colors } = useThemeStore();
  
  const currentTime = getCurrentTime();
  const [selectedHour, setSelectedHour] = React.useState(currentTime.hours);
  const [selectedMinute, setSelectedMinute] = React.useState(currentTime.minutes);
  const [selectedPeriod, setSelectedPeriod] = React.useState(currentTime.period);
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const hours = React.useMemo(() => generateHours(), []);
  const minutes = React.useMemo(() => generateMinutes(), []);

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => router.back());
  };

  const handleSave = async () => {
    const time = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
    await storage.setItem('selected_time', time);
    handleClose();
  };

  const presetTimes = [
    '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM',
    '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM',
    '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM',
    '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={handleClose}
      />
      <Animated.View 
        style={[
          styles.sheet,
          { 
            transform: [{ translateY: slideAnim }],
            backgroundColor: colors.modalBackground || '#FFFFFF'
          }
        ]}
      >
        <View style={styles.handle} />
        <Text style={[styles.title, { color: colors.text }]}>
          pick a time
        </Text>

        <View style={styles.pickerContainer}>
          <View style={[styles.customPicker, { width: SCREEN_WIDTH * 0.8 }]}>
            <ScrollView style={styles.pickerColumn} showsVerticalScrollIndicator={false}>
              {hours.map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={[
                    styles.pickerItem,
                    selectedHour === hour && styles.selectedItem
                  ]}
                  onPress={() => setSelectedHour(hour)}
                >
                  <Text style={[
                    styles.pickerText,
                    selectedHour === hour && styles.selectedText,
                    { color: colors.text }
                  ]}>
                    {hour}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={[styles.pickerSeparator, { color: colors.text }]}>:</Text>
            <ScrollView style={styles.pickerColumn} showsVerticalScrollIndicator={false}>
              {minutes.map((minute) => (
                <TouchableOpacity
                  key={minute}
                  style={[
                    styles.pickerItem,
                    selectedMinute === minute && styles.selectedItem
                  ]}
                  onPress={() => setSelectedMinute(minute)}
                >
                  <Text style={[
                    styles.pickerText,
                    selectedMinute === minute && styles.selectedText,
                    { color: colors.text }
                  ]}>
                    {minute}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.periodPicker}>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === 'AM' && styles.selectedPeriod
                ]}
                onPress={() => setSelectedPeriod('AM')}
              >
                <Text style={[
                  styles.periodText,
                  selectedPeriod === 'AM' && styles.selectedPeriodText
                ]}>AM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === 'PM' && styles.selectedPeriod
                ]}
                onPress={() => setSelectedPeriod('PM')}
              >
                <Text style={[
                  styles.periodText,
                  selectedPeriod === 'PM' && styles.selectedPeriodText
                ]}>PM</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.timesContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timesScrollContent}
          >
            {presetTimes.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeButton,
                  { backgroundColor: colors.surface || '#F5F5F5' }
                ]}
                onPress={() => {
                  const [timeStr, period] = time.split(' ');
                  const [hour, minute] = timeStr.split(':');
                  setSelectedHour(hour.padStart(2, '0'));
                  setSelectedMinute(minute);
                  setSelectedPeriod(period);
                }}
              >
                <Text style={[styles.timeText, { color: colors.text }]}>
                  {time.toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    height: SCREEN_HEIGHT * 0.55,
    width: '100%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#CFCFCF',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito_800ExtraBold',
    marginBottom: 20,
    textAlign: 'center',
  },
  pickerContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  customPicker: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
  },
  pickerColumn: {
    height: 200,
    width: 60,
  },
  pickerItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  pickerText: {
    fontSize: 20,
    fontFamily: 'Nunito_800ExtraBold',
  },
  selectedText: {
    color: '#CFCFCF',
  },
  pickerSeparator: {
    fontSize: 24,
    marginHorizontal: 10,
    fontFamily: 'Nunito_800ExtraBold',
  },
  periodPicker: {
    marginLeft: 10,
  },
  periodButton: {
    padding: 8,
    borderRadius: 8,
    marginVertical: 4,
  },
  selectedPeriod: {
    backgroundColor: '#CFCFCF',
  },
  periodText: {
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#666',
  },
  selectedPeriodText: {
    color: '#FFFFFF',
  },
  timesContainer: {
    marginBottom: 20,
  },
  timesScrollContent: {
    paddingHorizontal: 10,
    gap: 10,
  },
  timeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#CFCFCF',
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'Nunito_800ExtraBold',
  },
  saveButton: {
    backgroundColor: '#CFCFCF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
  },
}); 