import { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, LayoutAnimation } from 'react-native';
import * as Haptics from 'expo-haptics';
import moment from 'moment';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from '@react-navigation/native';
import { storage } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';
import useSettingsStore from '../store/settingsStore';

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

const formatCurrentTime = () => {
  const now = moment();
  const hour = now.format('h');
  const minute = now.format('mm');
  const period = now.format('a').toLowerCase();
  return `${hour}:${minute}${period}`;
};

export default function TodayScreen() {
  const router = useRouter();
  const removeAfterCompletion = useSettingsStore(state => state.removeAfterCompletion);
  const deletePreviousDayTasks = useSettingsStore(state => state.deletePreviousDayTasks);
  const loadSettings = useSettingsStore(state => state.loadSettings);

  const [selected, setSelected] = useState('today');
  const [doneTasks, setDoneTasks] = useState([]);
  const [text, setText] = useState('');
  const [tasks, setTasks] = useState([]);
  const [selectedTime, setSelectedTime] = useState(formatCurrentTime());
  const [isInputVisible, setIsInputVisible] = useState(false);
  const inputRef = useRef(null);

  const tabs = ['today', 'tomorrow'];

  useEffect(() => {
    const loadInitialData = async () => {
      // Clean up previous day tasks if setting is enabled
      if (deletePreviousDayTasks) {
        await storage.cleanupPreviousDayTasks();
      }

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
      
      if (storedTime) {
        setSelectedTime(storedTime);
      } else {
        setSelectedTime(formatCurrentTime());
      }
    };

    loadInitialData();
    loadSettings();
  }, [deletePreviousDayTasks]);

  useFocusEffect(
    useCallback(() => {
      const loadTasks = async () => {
        const storedTasks = await storage.getItem(TASKS_KEY);
        if (storedTasks) {
          const allTasks = JSON.parse(storedTasks);
          const today = moment().format('YYYY-MM-DD');
          const filtered = allTasks.filter(task => task.date === today);
          setTasks(filtered);
        }
      };
      loadTasks();
    }, [])
  );

  const addTask = async () => {
    if (!text.trim()) return;

    const newTask = {
      id: uuidv4(),
      title: text.trim(),
      time: selectedTime,
      date: moment().format('YYYY-MM-DD'),
      completed: false,
      notificationId: null,
    };

    try {
      // Schedule local notification
      const notificationId = await scheduleNotification(newTask);
      newTask.notificationId = notificationId;

      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      setText('');
      setIsInputVisible(false);

      // Save to local storage
      await saveTasks(updatedTasks);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Failed to add reminder. Please try again.');
    }
  };

  const toggleTask = async (taskId) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );

    setTasks(updatedTasks);
    await saveTasks(updatedTasks);

    // Cancel notification if task is completed
    const task = updatedTasks.find(t => t.id === taskId);
    if (task.completed && task.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(task.notificationId);
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Remove completed tasks if setting is enabled
    if (removeAfterCompletion && task.completed) {
      setTimeout(async () => {
        const filteredTasks = updatedTasks.filter(t => !t.completed);
        setTasks(filteredTasks);
        await saveTasks(filteredTasks);
      }, 1000);
    }
  };

  const deleteTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task?.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(task.notificationId);
    }

    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const saveTasks = async (todayTasks) => {
    try {
      // Always maintain local storage
      const storedTasks = await storage.getItem(TASKS_KEY);
      const allTasks = storedTasks ? JSON.parse(storedTasks) : [];
      const otherDaysTasks = allTasks.filter(task => task.date !== moment().format('YYYY-MM-DD'));
      const newTasks = [...otherDaysTasks, ...todayTasks];
      await storage.setItem(TASKS_KEY, JSON.stringify(newTasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
      throw error;
    }
  };

  const scheduleNotification = async (task) => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }

      const [time, period] = task.time.match(/(\d+):(\d+)(am|pm)/).slice(1);
      let hour = parseInt(time);
      const minute = parseInt(period);
      const ampm = period;

      if (ampm === 'pm' && hour !== 12) hour += 12;
      if (ampm === 'am' && hour === 12) hour = 0;

      const scheduledDate = moment(task.date)
        .hour(hour)
        .minute(minute)
        .second(0)
        .millisecond(0);

      if (scheduledDate.isBefore(moment())) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Reminder',
          body: task.title,
          sound: 'default',
        },
        trigger: {
          date: scheduledDate.toDate(),
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  };

  const openTimePicker = () => {
    router.push('/timePicker');
  };

  const openSettings = () => {
    router.push('/settings');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>remra</Text>
        <TouchableOpacity onPress={openSettings} style={styles.settingsButton}>
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selected === tab && styles.selectedTab]}
            onPress={() => {
              setSelected(tab);
              if (tab === 'tomorrow') {
                router.push('/tabs/tomorrow');
              }
            }}
          >
            <Text style={[styles.tabText, selected === tab && styles.selectedTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="add a reminder..."
          value={text}
          onChangeText={setText}
          onSubmitEditing={addTask}
          returnKeyType="done"
          onFocus={() => setIsInputVisible(true)}
          onBlur={() => setIsInputVisible(false)}
        />
        <TouchableOpacity style={styles.timeButton} onPress={openTimePicker}>
          <Text style={styles.timeButtonText}>{selectedTime}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.taskList}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        {tasks.map((task) => (
          <View key={task.id} style={styles.taskItem}>
            <TouchableOpacity
              style={[styles.checkbox, task.completed && styles.checked]}
              onPress={() => toggleTask(task.id)}
            >
              {task.completed && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <View style={styles.taskContent}>
              <Text style={[styles.taskText, task.completed && styles.completedTask]}>
                {task.title}
              </Text>
              <Text style={styles.taskTime}>{task.time}</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteTask(task.id)}
            >
              <Text style={styles.deleteButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
  },
  settingsButton: {
    padding: 10,
  },
  settingsButtonText: {
    fontSize: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  selectedTab: {
    borderBottomColor: '#000000',
  },
  tabText: {
    fontSize: 16,
    color: '#666666',
  },
  selectedTabText: {
    color: '#000000',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  timeButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  timeButtonText: {
    fontSize: 16,
    color: '#000000',
  },
  taskList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 4,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#999999',
  },
  taskTime: {
    fontSize: 14,
    color: '#666666',
  },
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    fontSize: 20,
    color: '#ff3b30',
  },
});
