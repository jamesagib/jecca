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
  const snapPoints = useMemo(() => ['40%'], []);
  const [time, setTime] = useState(new Date());

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
            <Text style={styles.title}>Pick a Time</Text>
            
            <DateTimePicker
              value={time}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                if (selectedDate) setTime(selectedDate);
              }}
              style={{ width: 250 }}
            />

            <TouchableOpacity style={styles.saveButton} onPress={saveTimeAndClose}>
              <Text style={styles.saveButtonText}>Done</Text>
            </TouchableOpacity>
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
    fontSize: 20,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#212121',
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#53d769',
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
  }
});
