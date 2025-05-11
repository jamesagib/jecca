import { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, LayoutAnimation } from 'react-native';
import * as Haptics from 'expo-haptics';
import moment from 'moment';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from '@react-navigation/native';

// Configure notifications to show when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const STORAGE_KEY = 'reminders';
const TOGGLE_KEY = 'remove_reminder_toggle';

export default function TodayScreen() {
  const router = useRouter();

  const [selected, setSelected] = useState('today');
  const [doneTasks, setDoneTasks] = useState([]);
  const [text, setText] = useState('');
  const [tasks, setTasks] = useState([]);
  const [removeAfterCompletion, setRemoveAfterCompletion] = useState(false);
  const [selectedTime, setSelectedTime] = useState('7am');
  const TIME_KEY = 'selected_time';

  const tabs = ['today', 'tomorrow'];

  const loadTasks = async () => {
    const data = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!data) return;
    const all = JSON.parse(data);
    const today = moment().format('YYYY-MM-DD');
    // Clear expired
    const filtered = all.filter(task => task.date === today);
    setTasks(filtered);
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(filtered));
  };

  const saveTasks = async (newTasks) => {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(newTasks));
  };

  useEffect(() => {
    loadTasks();
  }, []);

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

  // Replace the router.addListener effect with useFocusEffect
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

  const reloadData = async () => {
    const storedTasks = await SecureStore.getItemAsync(STORAGE_KEY);
    if (storedTasks) {
      const today = moment().format('YYYY-MM-DD');
      const filtered = JSON.parse(storedTasks).filter(task => task.date === today);
      setTasks(filtered);
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(filtered));
    }

    const storedToggle = await SecureStore.getItemAsync(TOGGLE_KEY);
    setRemoveAfterCompletion(storedToggle === 'true');
  };

  const clearAllReminders = async () => {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
    setTasks([]);
    reloadData();
  };

  const toggleSwitch = async () => {
    const newState = !removeAfterCompletion;
    setRemoveAfterCompletion(newState);
    await SecureStore.setItemAsync(TOGGLE_KEY, newState.toString());
    reloadData();
  };

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

  // Schedule notification for a task
  const scheduleNotification = async (task) => {
    try {
      // Cancel any existing notification for this task
      if (task.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(task.notificationId);
      }

      // Parse the time string (e.g., "7am" or "3:30pm")
      const timeStr = task.time.toLowerCase();
      const now = moment();
      const taskTime = moment(timeStr, ['ha', 'h:mma']); // Parse both "7am" and "3:30pm" formats
      
      // Set the notification time for today
      const notificationTime = moment()
        .hour(taskTime.hour())
        .minute(taskTime.minute())
        .second(0);

      // If the time has already passed today, don't schedule
      if (notificationTime.isBefore(now)) {
        return;
      }

      // Schedule the notification
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

      // Save the notification ID with the task
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const toggleTask = async (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (removeAfterCompletion) {
      const task = tasks.find(t => t.id === id);
      if (task?.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(task.notificationId);
      }
      const updatedTasks = tasks.filter(task => task.id !== id);
      setTasks(updatedTasks);
      saveTasks(updatedTasks);
    } else {
      setDoneTasks((prev) =>
        prev.includes(id) ? prev.filter(taskId => taskId !== id) : [...prev, id]
      );
    }
  };

  const handleSubmit = async () => {
    if (text.trim() === '') return;
    // Get the most recent time from storage
    const currentTime = await SecureStore.getItemAsync(TIME_KEY) || selectedTime;
    const newTask = {
      id: Date.now(),
      title: text,
      time: currentTime,
      date: moment().format('YYYY-MM-DD'),
    };

    // Schedule notification and get notification ID
    const notificationId = await scheduleNotification(newTask);
    if (notificationId) {
      newTask.notificationId = notificationId;
    }

    const updated = [...tasks, newTask];
    setTasks(updated);
    setText('');
    await saveTasks(updated);
  };

  const handleDelete = (id) => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      { text: "OK", onPress: () => deleteTask(id) },
    ]);
  };

  const deleteTask = async (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const task = tasks.find(t => t.id === id);
    if (task?.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(task.notificationId);
    }
    const updated = tasks.filter(task => task.id !== id);
    setTasks(updated);
    await saveTasks(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
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
            <Text style={styles.dateText}>{moment().format('ddd. MMM D').toLowerCase()}</Text>
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
                style={[styles.reminderName, { color: doneTasks.includes(item.id) ? "#212121" : "#CFCFCF" }]}
              >
                {item.title}
              </Text>
              <View
                style={[styles.timeContainer, { borderColor: doneTasks.includes(item.id) ? "#212121" : "#CFCFCF" }]}
              >
                <Text
                  style={[styles.timeText, { color: doneTasks.includes(item.id) ? "#212121" : "#CFCFCF" }]}
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
                style={[styles.tabText, tab === 'today' && styles.selectedText]}
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
    justifyContent: 'center',
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
    marginLeft: 5,
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
