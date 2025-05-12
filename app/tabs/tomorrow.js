import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import moment from 'moment';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

// Configure notifications to show when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function TomorrowScreen() {
  const router = useRouter();

  const [tasks, setTasks] = useState([]);
  const [doneTasks, setDoneTasks] = useState([]);
  const [text, setText] = useState('');
  const [removeAfterCompletion, setRemoveAfterCompletion] = useState(false);
  const [selectedTime, setSelectedTime] = useState('7am');
  const tabs = ['today', 'tomorrow'];

  const STORAGE_KEY = 'reminders_tomorrow';
  const DATE_KEY = 'reminders_tomorrow_date';
  const TOGGLE_KEY = 'remove_reminder_toggle';
  const TIME_KEY = 'selected_time';

  useEffect(() => {
    const checkAndLoadTasks = async () => {
      const storedDate = await SecureStore.getItemAsync(DATE_KEY);
      const todayDate = moment().format('YYYY-MM-DD');

      if (storedDate !== todayDate) {
        await SecureStore.deleteItemAsync(STORAGE_KEY);
        await SecureStore.setItemAsync(DATE_KEY, todayDate);
        setTasks([]);
      } else {
        const storedTasks = await SecureStore.getItemAsync(STORAGE_KEY);
        if (storedTasks) {
          setTasks(JSON.parse(storedTasks));
        }
      }
    };

    checkAndLoadTasks();
  }, []);

  useEffect(() => {
    SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const loadToggleState = async () => {
      const storedToggle = await SecureStore.getItemAsync(TOGGLE_KEY);
      setRemoveAfterCompletion(storedToggle === 'true');
    };
    loadToggleState();
  }, []);

  useEffect(() => {
    const loadSelectedTime = async () => {
      const storedTime = await SecureStore.getItemAsync(TIME_KEY);
      if (storedTime) {
        setSelectedTime(storedTime);
      }
    };
    loadSelectedTime();
  }, []);

  // Replace the router focus listener with useFocusEffect
  useFocusEffect(
    useCallback(() => {
      const updateTime = async () => {
        const storedTime = await SecureStore.getItemAsync(TIME_KEY);
        if (storedTime) {
          setSelectedTime(storedTime);
        }
      };
      updateTime();
    }, [])
  );

  // Request notification permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Push notifications are required for reminders to work.');
      }
    };
    requestPermissions();
  }, []);

  // Schedule notification for tomorrow's task
  const scheduleNotification = async (task) => {
    try {
      // Cancel any existing notification for this task
      if (task.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(task.notificationId);
      }

      // Parse the time string (e.g., "7am" or "3:30pm")
      const timeStr = task.time.toLowerCase();
      const now = moment();
      let notificationTime = moment(timeStr, ['ha', 'h:mma']); // Parse both "7am" and "3:30pm" formats
      
      // Set notification for tomorrow with the selected time
      notificationTime = moment()
        .add(1, 'day')
        .hours(notificationTime.hours())
        .minutes(notificationTime.minutes())
        .seconds(0);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Reminder',
          body: `${task.title}`,
          sound: true,
        },
        trigger: {
          date: notificationTime.toDate(),
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const reloadData = async () => {
    const storedDate = await SecureStore.getItemAsync(DATE_KEY);
    const todayDate = moment().format('YYYY-MM-DD');

    if (storedDate !== todayDate) {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
      await SecureStore.setItemAsync(DATE_KEY, todayDate);
      setTasks([]);
    } else {
      const storedTasks = await SecureStore.getItemAsync(STORAGE_KEY);
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    }

    const storedToggle = await SecureStore.getItemAsync(TOGGLE_KEY);
    setRemoveAfterCompletion(storedToggle === 'true');
  };

  const clearReminders = async () => {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
    setTasks([]);
    reloadData();
  };

  const toggleSwitch = async () => {
    const newToggleState = !removeAfterCompletion;
    setRemoveAfterCompletion(newToggleState);
    await SecureStore.setItemAsync(TOGGLE_KEY, newToggleState.toString());
    reloadData();
  };

  // Modify toggleTask to cancel notification if task is completed
  const toggleTask = async (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (removeAfterCompletion) {
      const task = tasks.find(t => t.id === id);
      if (task?.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(task.notificationId);
      }
      const updatedTasks = tasks.filter(task => task.id !== id);
      setTasks(updatedTasks);
      SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(updatedTasks));
    } else {
      setDoneTasks((prev) =>
        prev.includes(id) ? prev.filter(taskId => taskId !== id) : [...prev, id]
      );
    }
  };

  // Modify handleSubmit to include notification scheduling
  const handleSubmit = async () => {
    if (text.trim() === '') return;
    // Get the most recent time from storage
    const currentTime = await SecureStore.getItemAsync(TIME_KEY) || selectedTime;
    const newTask = {
      id: Date.now().toString(),
      title: text,
      time: currentTime
    };

    // Schedule notification and get notification ID
    const notificationId = await scheduleNotification(newTask);
    if (notificationId) {
      newTask.notificationId = notificationId;
    }

    setTasks([...tasks, newTask]);
    setText('');

    // Save tasks with notification ID
    const updatedTasks = [...tasks, newTask];
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(updatedTasks));
  };

  // Modify handleDelete to cancel notification
  const handleDelete = (id) => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to delete this task?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            const task = tasks.find(t => t.id === id);
            if (task?.notificationId) {
              await Notifications.cancelScheduledNotificationAsync(task.notificationId);
            }
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            const updatedTasks = tasks.filter(task => task.id !== id);
            setTasks(updatedTasks);
            await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(updatedTasks));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
          }
        }
      ]
    );
  };

  const saveTimeForTask = async (taskId, time) => {
    const storedTasks = await SecureStore.getItemAsync(STORAGE_KEY);
    if (storedTasks) {
      const tasks = JSON.parse(storedTasks);
      const updatedTasks = tasks.map(task =>
        task.id === taskId ? { ...task, time } : task
      );
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={60}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Text style={styles.dateText}>
              {moment().add(1, 'day').format('ddd. MMM D').toLowerCase()}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {tasks.map((item) => (
            <TouchableOpacity
              style={styles.reminderContainer}
              key={item.id}
              onPress={() => toggleTask(item.id)}
              onLongPress={() => handleDelete(item.id)}
            >
              <Text
                style={[
                  styles.reminderName,
                  { color: doneTasks.includes(item.id) ? "#212121" : "#CFCFCF" },
                ]}
              >
                {item.title}
              </Text>
              <View
                style={[
                  styles.timeContainer,
                  { borderColor: doneTasks.includes(item.id) ? "#212121" : "#CFCFCF" },
                ]}
              >
                <Text
                  style={[
                    styles.timeText,
                    { color: doneTasks.includes(item.id) ? "#212121" : "#CFCFCF" },
                  ]}
                >
                  {item.time}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          <View style={styles.newItemContainer}>
            <TextInput
              placeholderTextColor={"#CFCFCF"}
              placeholder='+ add item...'
              style={styles.addItemInput}
              onChangeText={setText}
              onSubmitEditing={handleSubmit}
              value={text}
              autoCapitalize='none'
            />
            <TouchableOpacity onPress={() => router.push('/timePicker')} style={styles.inputTimeContainer}>
              <Text style={styles.timeText}>{selectedTime}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomBar}>
          {tabs.map((tab) => (
            <TouchableOpacity key={tab} onPress={() => router.push(`/tabs/${tab}`)}>
              <Text
                style={[
                  styles.tabText,
                  tab === 'tomorrow' && styles.selectedText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center' 
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    height: 100,
  },
  dateText: {
    fontSize: 28,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#212121',
  },
  listContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    gap: 5
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
  },
  reminderName: {
    flex: 0,
    fontSize: 25,
    fontFamily: 'Nunito_800ExtraBold',
    textAlign: 'center',
    color: '#4A4A4A',
    flexShrink: 1,
  },
  timeContainer: {
    marginLeft: 5, // Add small spacing between reminderName and timeContainer
    minWidth: 65,
    height: 25,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#CFCFCF',
    textAlign: 'center',
    lineHeight: 22,
    padding: 1,
  },
  newItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%'
  },
  addItemInput: {
    fontSize: 25,
    fontFamily: 'Nunito_800ExtraBold',
  },
  inputTimeContainer: {
    marginLeft: 5, // Add small spacing between reminderName and timeContainer
    minWidth: 65,
    height: 25,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginLeft: 10,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  tabText: {
    fontSize: 25,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#ccc',
  },
  selectedText: {
    color: '#212121',
  },
});
