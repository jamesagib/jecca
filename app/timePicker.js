import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Picker } from '@react-native-picker/picker';
import { storage } from './utils/storage';
import moment from 'moment';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  runOnJS
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TIME_KEY = 'selected_time';

const getCurrentTimeComponents = () => {
  const now = moment();
  const hour = now.format('h'); // 12-hour format without leading zero
  const minute = now.format('mm'); // minutes with leading zero
  const period = now.format('a').toLowerCase(); // 'am' or 'pm' in lowercase
  return { hour, minute, period };
};

export default function TimePickerScreen() {
  const router = useRouter();
  const { hour, minute, period } = getCurrentTimeComponents();
  const [selectedHour, setSelectedHour] = useState(hour);
  const [selectedMinute, setSelectedMinute] = useState(minute);
  const [selectedPeriod, setSelectedPeriod] = useState(period);
  const [isVisible, setIsVisible] = useState(true);
  const translateY = useSharedValue(SCREEN_HEIGHT);

  useEffect(() => {
    const loadTime = async () => {
      const storedTime = await storage.getItem(TIME_KEY);
      if (storedTime) {
        const [time, period] = storedTime.toLowerCase().split(/(?=[ap]m)/);
        const [hour, minute = '00'] = time.split(':');
        setSelectedHour(hour);
        setSelectedMinute(minute);
        setSelectedPeriod(period);
      }
      // If no stored time, keep the current time we set in initial state
    };
    loadTime();

    // Start entrance animation
    translateY.value = withSpring(0, {
      damping: 20,
      mass: 0.7,
      stiffness: 100,
    });
  }, []);

  const handleClose = () => {
    translateY.value = withTiming(SCREEN_HEIGHT, {
      duration: 250,
    }, () => {
      runOnJS(setIsVisible)(false);
      runOnJS(router.back)();
    });
  };

  const handleSave = async () => {
    const formattedTime = `${selectedHour}:${selectedMinute}${selectedPeriod}`;
    await storage.setItem(TIME_KEY, formattedTime);
    handleClose();
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  if (!isVisible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Modal
        transparent
        visible={isVisible}
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        <View style={styles.container}>
          <TouchableOpacity 
            style={styles.backdrop} 
            activeOpacity={1} 
            onPress={handleClose}
          />
          <Animated.View 
            style={[
              styles.sheet,
              animatedStyle
            ]}
          >
            <View style={styles.handle} />
            <Text style={styles.title}>select time</Text>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedHour}
                onValueChange={setSelectedHour}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {Array.from({ length: 12 }, (_, i) => (i + 1).toString()).map(hour => (
                  <Picker.Item key={hour} label={hour} value={hour} />
                ))}
              </Picker>

              <Text style={styles.pickerSeparator}>:</Text>

              <Picker
                selectedValue={selectedMinute}
                onValueChange={setSelectedMinute}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(minute => (
                  <Picker.Item key={minute} label={minute} value={minute} />
                ))}
              </Picker>

              <Picker
                selectedValue={selectedPeriod}
                onValueChange={setSelectedPeriod}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {['am', 'pm'].map(period => (
                  <Picker.Item key={period} label={period} value={period} />
                ))}
              </Picker>
            </View>

            <View style={styles.presetContainer}>
              {['7:00am', '8:00am', '9:00am', '12:00pm', '3:00pm', '6:00pm'].map(time => (
                <TouchableOpacity
                  key={time}
                  style={styles.presetButton}
                  onPress={async () => {
                    await storage.setItem(TIME_KEY, time);
                    handleClose();
                  }}
                >
                  <Text style={styles.timeText}>{time}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
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
    height: SCREEN_HEIGHT * 0.65,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
    color: '#000000',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  picker: {
    flex: 1,
    height: 200,
  },
  pickerItem: {
    fontSize: 22,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#000000',
  },
  pickerSeparator: {
    fontSize: 24,
    fontFamily: 'Nunito_800ExtraBold',
    marginHorizontal: 10,
    color: '#000000',
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 30,
  },
  presetButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timeText: {
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#000000',
  },
  saveButton: {
    backgroundColor: '#000000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#FFFFFF',
  },
}); 