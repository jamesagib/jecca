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

const TASKS_KEY = 'tasks';
const TOGGLE_KEY = 'remove_reminder_toggle';
const TIME_KEY = 'selected_time';
const REPEAT_KEY = 'selected_repeat';

export default function TomorrowScreen() {
  const router = useRouter();

  const [tasks, setTasks] = useState([]);
  const [doneTasks, setDoneTasks] = useState([]);
  const [text, setText] = useState('');
  const [removeAfterCompletion, setRemoveAfterCompletion] = useState(false);
  const [selectedTime, setSelectedTime] = useState('7am');
  const tabs = ['today', 'tomorrow'];

  const DATE_KEY = 'reminders_tomorrow_date';

  useEffect(() => {
    const loadInitialData = async () => {
      // Load tasks
      const storedTasks = await SecureStore.getItemAsync(TASKS_KEY);
      if (storedTasks) {
        const allTasks = JSON.parse(storedTasks);
        const tomorrow = moment().add(1, 'day').format('YYYY-MM-DD');
        const filtered = allTasks.filter(task => task.date === tomorrow);
        setTasks(filtered);
      }

      // Load toggle and time settings
      const storedToggle = await SecureStore.getItemAsync(TOGGLE_KEY);
      const storedTime = await SecureStore.getItemAsync(TIME_KEY);
      
      setRemoveAfterCompletion(storedToggle === 'true');
      if (storedTime) {
        setSelectedTime(storedTime);
      }
    };

    loadInitialData();
  }, []);

  // Single useFocusEffect for all state updates
  useFocusEffect(
    useCallback(() => {
      const updateState = async () => {
        // Update time
        const storedTime = await SecureStore.getItemAsync(TIME_KEY);
        if (storedTime) {
          setSelectedTime(storedTime);
        }
        
        // Reload tasks
        const storedTasks = await SecureStore.getItemAsync(TASKS_KEY);
        if (storedTasks) {
          const allTasks = JSON.parse(storedTasks);
          const tomorrow = moment().add(1, 'day').format('YYYY-MM-DD');
          const filtered = allTasks.filter(task => task.date === tomorrow);
          setTasks(filtered);
        }
      };
      updateState();
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

  const getNextOccurrence = (task) => {
    if (!task.repeat || task.repeat === 'none') return null;

    const taskTime = moment(task.time, 'h:mma');
    let nextDate = moment().add(1, 'day').hours(taskTime.hours()).minutes(taskTime.minutes());

    switch (task.repeat) {
      case 'daily':
        nextDate = nextDate.add(1, 'day');
        break;
      case 'weekdays':
        nextDate = nextDate.add(1, 'day');
        while (nextDate.day() === 0 || nextDate.day() === 6) {
          nextDate = nextDate.add(1, 'day');
        }
        break;
      case 'weekly':
        nextDate = nextDate.add(1, 'week');
        break;
      case 'monthly':
        nextDate = nextDate.add(1, 'month');
        break;
    }
    return nextDate;
  };

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
    const storedTasks = await SecureStore.getItemAsync(TASKS_KEY);
    if (storedTasks) {
      const allTasks = JSON.parse(storedTasks);
      const tomorrow = moment().add(1, 'day').format('YYYY-MM-DD');
      const filtered = allTasks.filter(task => task.date === tomorrow);
      setTasks(filtered);
    }

    const storedToggle = await SecureStore.getItemAsync(TOGGLE_KEY);
    setRemoveAfterCompletion(storedToggle === 'true');
  };

  const clearReminders = async () => {
    await SecureStore.deleteItemAsync(TASKS_KEY);
    setTasks([]);
    reloadData();
  };

  const toggleSwitch = async () => {
    const newState = !removeAfterCompletion;
    setRemoveAfterCompletion(newState);
    await SecureStore.setItemAsync(TOGGLE_KEY, newState.toString());
  };

  // Modify toggleTask to cancel notification if task is completed
  const toggleTask = async (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const task = tasks.find(t => t.id === id);
    
    if (removeAfterCompletion) {
      if (task?.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(task.notificationId);
      }
      
      // If task repeats, create next occurrence
      if (task.repeat && task.repeat !== 'none') {
        const nextDate = getNextOccurrence(task);
        if (nextDate) {
          const newTask = {
            ...task,
            id: Date.now().toString(),
            date: nextDate.format('YYYY-MM-DD'),
          };
          const notificationId = await scheduleNotification(newTask);
          if (notificationId) {
            newTask.notificationId = notificationId;
          }
          const updatedTasks = tasks.filter(t => t.id !== id).concat(newTask);
          setTasks(updatedTasks);
          await saveTasks(updatedTasks);
          return;
        }
      }
      
      const updatedTasks = tasks.filter(task => task.id !== id);
      setTasks(updatedTasks);
      await saveTasks(updatedTasks);
    } else {
      setDoneTasks((prev) =>
        prev.includes(id) ? prev.filter(taskId => taskId !== id) : [...prev, id]
      );
    }
  };

  const saveTasks = async (tomorrowTasks) => {
    try {
      const storedTasks = await SecureStore.getItemAsync(TASKS_KEY);
      const allTasks = storedTasks ? JSON.parse(storedTasks) : [];
      const tomorrow = moment().add(1, 'day').format('YYYY-MM-DD');
      
      // Remove tomorrow's tasks and add updated ones
      const otherDaysTasks = allTasks.filter(task => task.date !== tomorrow);
      const newTasks = [...otherDaysTasks, ...tomorrowTasks];
      
      await SecureStore.setItemAsync(TASKS_KEY, JSON.stringify(newTasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  };

  const handleSubmit = async () => {
    if (text.trim() === '') return;
    const currentTime = await SecureStore.getItemAsync(TIME_KEY) || selectedTime;
    const repeatOption = await SecureStore.getItemAsync(REPEAT_KEY) || 'none';
    
    const newTask = {
      id: Date.now().toString(),
      title: text.trim(),
      time: currentTime,
      date: moment().add(1, 'day').format('YYYY-MM-DD'),
      repeat: repeatOption,
    };

    const notificationId = await scheduleNotification(newTask);
    if (notificationId) {
      newTask.notificationId = notificationId;
    }

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    setText('');
    await saveTasks(updatedTasks);
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
            await saveTasks(updatedTasks);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
          }
        }
      ]
    );
  };

  const saveTimeForTask = async (taskId, time) => {
    const storedTasks = await SecureStore.getItemAsync(TASKS_KEY);
    if (storedTasks) {
      const tasks = JSON.parse(storedTasks);
      const updatedTasks = tasks.map(task =>
        task.id === taskId ? { ...task, time } : task
      );
      await SecureStore.setItemAsync(TASKS_KEY, JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
    }
  };

  const wouldBeOverdue = (time) => {
    const timeStr = time.toLowerCase();
    const now = moment();
    const reminderTime = moment(timeStr, ['ha', 'h:mma']);
    
    // Set the reminder time to tomorrow's date
    const tomorrowReminderTime = moment()
      .add(1, 'day')
      .hours(reminderTime.hours())
      .minutes(reminderTime.minutes())
      .seconds(0);
    
    return now.isAfter(tomorrowReminderTime);
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
                  { 
                    color: wouldBeOverdue(item.time) ? "#FF0000" : 
                           doneTasks.includes(item.id) ? "#212121" : "#CFCFCF" 
                  }
                ]}
              >
                {item.title}
              </Text>
              <View
                style={[
                  styles.timeContainer,
                  { 
                    borderColor: wouldBeOverdue(item.time) ? "#FF0000" : 
                                doneTasks.includes(item.id) ? "#212121" : "#CFCFCF" 
                  }
                ]}
              >
                <Text
                  style={[
                    styles.timeText,
                    { 
                      color: wouldBeOverdue(item.time) ? "#FF0000" : 
                             doneTasks.includes(item.id) ? "#212121" : "#CFCFCF" 
                    }
                  ]}
                >
                  {item.time}
                </Text>
                {item.repeat && item.repeat !== 'none' && (
                  <View 
                    style={[
                      styles.repeatDot,
                      {
                        backgroundColor: wouldBeOverdue(item.time) ? "#FF0000" : 
                                       doneTasks.includes(item.id) ? "#212121" : "#CFCFCF"
                      }
                    ]} 
                  />
                )}
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
    marginLeft: 5,
    minWidth: 65,
    height: 25,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  repeatDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CFCFCF',
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
