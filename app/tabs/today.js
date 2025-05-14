import { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, LayoutAnimation } from 'react-native';
import * as Haptics from 'expo-haptics';
import moment from 'moment';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from '@react-navigation/native';
import { storage } from '../utils/storage';

// Configure notifications to show when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const TASKS_KEY = 'tasks'; // Use single storage key for all tasks
const TOGGLE_KEY = 'remove_reminder_toggle';
const TIME_KEY = 'selected_time';
const REPEAT_KEY = 'selected_repeat'; // Match the key used in timePicker.js

export default function TodayScreen() {
  const router = useRouter();

  const [selected, setSelected] = useState('today');
  const [doneTasks, setDoneTasks] = useState([]);
  const [text, setText] = useState('');
  const [tasks, setTasks] = useState([]);
  const [removeAfterCompletion, setRemoveAfterCompletion] = useState(false);
  const [selectedTime, setSelectedTime] = useState('7am');
  const [isInputVisible, setIsInputVisible] = useState(false);
  const inputRef = useRef(null);

  const tabs = ['today', 'tomorrow'];

  useEffect(() => {
    const loadInitialData = async () => {
      // Load tasks
      const storedTasks = await storage.getItem(TASKS_KEY);
      if (storedTasks) {
        const allTasks = JSON.parse(storedTasks);
        const today = moment().format('YYYY-MM-DD');
        const filtered = allTasks.filter(task => task.date === today);
        setTasks(filtered);
      }

      // Load toggle and time settings
      const storedToggle = await storage.getItem(TOGGLE_KEY);
      const storedTime = await storage.getItem(TIME_KEY);
      
      setRemoveAfterCompletion(storedToggle === 'true');
      if (storedTime) {
        setSelectedTime(storedTime);
      }
    };

    loadInitialData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const updateState = async () => {
        // Update time
        const storedTime = await storage.getItem(TIME_KEY);
        if (storedTime) {
          setSelectedTime(storedTime);
        }
        
        // Reload tasks
        const storedTasks = await storage.getItem(TASKS_KEY);
        if (storedTasks) {
          const allTasks = JSON.parse(storedTasks);
          const today = moment().format('YYYY-MM-DD');
          const filtered = allTasks.filter(task => task.date === today);
          setTasks(filtered);
        }
      };
      updateState();
    }, [])
  );

  const reloadData = async () => {
    const storedTasks = await storage.getItem(TASKS_KEY);
    if (storedTasks) {
      const today = moment().format('YYYY-MM-DD');
      const filtered = JSON.parse(storedTasks).filter(task => task.date === today);
      setTasks(filtered);
    }

    const storedToggle = await storage.getItem(TOGGLE_KEY);
    setRemoveAfterCompletion(storedToggle === 'true');
  };

  const clearAllReminders = async () => {
    await storage.removeItem(TASKS_KEY);
    setTasks([]);
    reloadData();
  };

  const toggleSwitch = async () => {
    const newState = !removeAfterCompletion;
    setRemoveAfterCompletion(newState);
    await storage.setItem(TOGGLE_KEY, newState.toString());
  };

  // Removed duplicate notification permission request since it's handled in onboarding

  const getNextOccurrence = (task) => {
    if (!task.repeat || task.repeat === 'none') return null;

    const currentDate = moment();
    const taskTime = moment(task.time, 'h:mma');
    let nextDate = moment().hours(taskTime.hours()).minutes(taskTime.minutes());

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

  const scheduleNotification = async (task) => {
    try {
      if (task.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(task.notificationId);
      }

      // Parse the time string (e.g., "7am" or "3:30pm")
      const timeStr = task.time.toLowerCase();
      const now = moment();
      let notificationTime = moment(timeStr, ['ha', 'h:mma']); // Parse both "7am" and "3:30pm" formats
      
      // Set notification for today with the selected time
      notificationTime = moment()
        .hours(notificationTime.hours())
        .minutes(notificationTime.minutes())
        .seconds(0);

      // If the time has already passed today, don't schedule
      if (notificationTime.isBefore(now)) {
        if (task.repeat && task.repeat !== 'none') {
          notificationTime = getNextOccurrence(task);
        } else {
          console.log('Time has already passed for today, not scheduling notification');
          return;
        }
      }

      // Schedule the notification with proper date
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Reminder',
          body: `${task.title}`,
          sound: true,
        },
        trigger: {
          date: notificationTime.toDate(), // Use the full date object
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
            id: Date.now(),
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
      
      const updatedTasks = tasks.filter(t => t.id !== id);
      setTasks(updatedTasks);
      await saveTasks(updatedTasks);
    } else {
      setDoneTasks((prev) =>
        prev.includes(id) ? prev.filter(taskId => taskId !== id) : [...prev, id]
      );
    }
  };

  const saveTasks = async (todayTasks) => {
    try {
      const storedTasks = await storage.getItem(TASKS_KEY);
      const allTasks = storedTasks ? JSON.parse(storedTasks) : [];
      const today = moment().format('YYYY-MM-DD');
      
      // Remove today's tasks and add updated ones
      const otherDaysTasks = allTasks.filter(task => task.date !== today);
      const newTasks = [...otherDaysTasks, ...todayTasks];
      
      await storage.setItem(TASKS_KEY, JSON.stringify(newTasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  };

  const handleSubmit = async () => {
    if (text.trim() === '') return;
    const currentTime = await storage.getItem(TIME_KEY) || selectedTime;
    const repeatOption = await storage.getItem(REPEAT_KEY) || 'none';

    const newTask = {
      id: Date.now(),
      title: text.trim(),
      time: currentTime,
      date: moment().format('YYYY-MM-DD'),
      repeat: repeatOption,
    };

    const notificationId = await scheduleNotification(newTask);
    if (notificationId) {
      newTask.notificationId = notificationId;
    }

    const updated = [...tasks, newTask];
    setTasks(updated);
    setText('');
    setIsInputVisible(false);
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
    const storedTasks = await storage.getItem(TASKS_KEY);
    if (storedTasks) {
      const tasks = JSON.parse(storedTasks);
      const updatedTasks = tasks.map(task =>
        task.id === taskId ? { ...task, time } : task
      );
      await storage.setItem(TASKS_KEY, JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
    }
  };

  const isOverdue = (time) => {
    const timeStr = time.toLowerCase();
    const now = moment();
    const reminderTime = moment(timeStr, ['ha', 'h:mma']);
    
    // Set the reminder time to today's date
    const todayReminderTime = moment()
      .hours(reminderTime.hours())
      .minutes(reminderTime.minutes())
      .seconds(0);
    
    return moment().isAfter(todayReminderTime);
  };

  const getEmptyStateMessage = () => {
    if (tasks.length === 0) {
      return "nothing to do today! \ntake a nap? 😴";
    }
    if (tasks.every(task => doneTasks.includes(task.id))) {
      return "wow, you're on fire! \nall tasks completed! 🎉";
    }
    return null;
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
          <View style={styles.mainContent}>
            <View style={styles.centerContainer}>
              {getEmptyStateMessage() && !isInputVisible && (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyStateText}>{getEmptyStateMessage()}</Text>
                  <TouchableOpacity 
                    style={styles.addTaskButton}
                    onPress={() => {
                      setIsInputVisible(true);
                      setTimeout(() => inputRef.current?.focus(), 100);
                    }}
                  >
                    <Text style={styles.addTaskButtonText}>add something to do...</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <View style={styles.taskListContainer}>
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
                          color: isOverdue(item.time) ? "#FF0000" : 
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
                          borderColor: isOverdue(item.time) ? "#FF0000" : 
                                      doneTasks.includes(item.id) ? "#212121" : "#CFCFCF" 
                        }
                      ]}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          { 
                            color: isOverdue(item.time) ? "#FF0000" : 
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
                              backgroundColor: isOverdue(item.time) ? "#FF0000" : 
                                             doneTasks.includes(item.id) ? "#212121" : "#CFCFCF"
                            }
                          ]} 
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {(isInputVisible || tasks.length > 0) && (
                <View style={styles.inputSection}>
                  <View style={styles.newItemContainer}>
                    <TextInput
                      ref={inputRef}
                      placeholderTextColor={"#CFCFCF"}
                      placeholder='+ add item...'
                      style={styles.addItemInput}
                      onChangeText={setText}
                      onSubmitEditing={handleSubmit}
                      value={text}
                      autoCapitalize='none'
                      onBlur={() => {
                        if (text.trim() === '') {
                          setIsInputVisible(false);
                        }
                      }}
                    />
                    <TouchableOpacity onPress={() => router.push('/timePicker')} style={styles.inputTimeContainer}>
                      <Text style={styles.timeText}>{selectedTime}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
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
    maxWidth: Platform.OS === 'web' ? 600 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Platform.OS === 'web' ? 30 : 10,
    height: Platform.OS === 'web' ? 80 : 100,
    width: '100%',
  },
  dateText: {
    fontSize: Platform.select({ web: 36, default: 28 }),
    fontFamily: 'Nunito_800ExtraBold',
    color: '#212121',
  },
  listContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: Platform.select({ web: '60%', default: '90%' }),
    maxWidth: Platform.select({ web: 800, default: undefined }),
    gap: 5
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: Platform.OS === 'web' ? '80%' : '90%',
    marginBottom: Platform.OS === 'web' ? 10 : 0,
  },
  reminderName: {
    flex: 0,
    fontSize: Platform.select({ web: 32, default: 25 }),
    fontFamily: 'Nunito_800ExtraBold',
    textAlign: 'center',
    color: '#4A4A4A',
    flexShrink: 1,
  },
  timeContainer: {
    marginLeft: 5,
    minWidth: Platform.select({ web: 80, default: 65 }),
    height: Platform.select({ web: 32, default: 25 }),
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
    fontSize: Platform.select({ web: 16, default: 14 }),
    fontFamily: 'Nunito_800ExtraBold',
    color: '#CFCFCF',
    textAlign: 'center',
    lineHeight: Platform.select({ web: 24, default: 22 }),
    padding: 1,
  },
  newItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%'
  },
  addItemInput: {
    fontSize: Platform.select({ web: 32, default: 25 }),
    fontFamily: 'Nunito_800ExtraBold',
  },
  inputTimeContainer: {
    marginLeft: 10,
    minWidth: Platform.select({ web: 80, default: 65 }),
    height: Platform.select({ web: 32, default: 25 }),
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: Platform.select({ web: 50, default: 30 }),
    left: Platform.select({ web: '20%', default: 50 }),
    right: Platform.select({ web: '20%', default: 50 }),
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: 'white',
    width: Platform.OS === 'web' ? 200 : undefined,
    borderRadius: Platform.OS === 'web' ? 20 : 0,
    shadowColor: Platform.OS === 'web' ? '#000' : undefined,
    shadowOffset: Platform.OS === 'web' ? { width: 0, height: 2 } : undefined,
    shadowOpacity: Platform.OS === 'web' ? 0.1 : undefined,
    shadowRadius: Platform.OS === 'web' ? 4 : undefined,
  },
  tabText: {
    fontSize: Platform.select({ web: 32, default: 25 }),
    fontFamily: 'Nunito_800ExtraBold',
    color: '#ccc',
  },
  selectedText: {
    color: '#212121',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  mainContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskListContainer: {
    width: '100%',
    alignItems: 'center',
  },
  inputSection: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTaskButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 40,
  },
  addTaskButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#212121',
  },
  emptyStateText: {
    fontSize: Platform.select({ web: 28, default: 21 }),
    fontFamily: 'Nunito_800ExtraBold',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 20,
  },
});
