import { useEffect, useState, useCallback, useRef } from 'react';
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
  StatusBar,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import moment from 'moment';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { storage } from '../utils/storage';
import { useAuthStore } from '../utils/auth';
import { useThemeStore } from '../utils/theme';
import { scheduleNotificationWithSupabase } from '../utils/notifications';
import { syncReminders, syncDeleteReminder, syncReminderStatus } from '../utils/sync';
import { upsertReminders } from '../utils/supabaseApi';

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

export default function TomorrowScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isDarkMode, getColors } = useThemeStore();
  const colors = getColors();

  const [tasks, setTasks] = useState([]);
  const [doneTasks, setDoneTasks] = useState([]);
  const [text, setText] = useState('');
  const [removeAfterCompletion, setRemoveAfterCompletion] = useState(false);
  const [selectedTime, setSelectedTime] = useState('7:00am');
  const tabs = ['today', 'tomorrow'];
  const inputRef = useRef(null);
  const [isInputVisible, setIsInputVisible] = useState(false);

  const DATE_KEY = 'reminders_tomorrow_date';

  useEffect(() => {
    const loadInitialData = async () => {
      // Load tasks
      const storedTasks = await storage.getItem(TASKS_KEY);
      if (storedTasks) {
        const allTasks = JSON.parse(storedTasks);
        const tomorrow = moment().add(1, 'day').format('YYYY-MM-DD');
        const filtered = allTasks.filter(task => task.date === tomorrow);
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

  // Single useFocusEffect for all state updates
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

  // Update scheduleNotification to use Supabase
  const scheduleNotification = async (task) => {
    try {
      if (task.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(task.notificationId);
      }

      // If user is logged in, use Supabase Edge Function
      if (user) {
        const result = await scheduleNotificationWithSupabase(task);
        if (result) {
          return result.id; // Use the Supabase notification ID
        }
      }

      // Fallback to local notifications if not logged in or Supabase fails
      const timeStr = task.time.toLowerCase();
      const [time, period] = timeStr.match(/(\d+):?(\d*)\s*(am|pm)/i).slice(1);
      let hours = parseInt(time);
      let minutes = 0;

      if (timeStr.includes(':')) {
        minutes = parseInt(timeStr.split(':')[1].replace(/[^\d]/g, ''));
      }

      if (period.toLowerCase() === 'pm' && hours !== 12) {
        hours += 12;
      } else if (period.toLowerCase() === 'am' && hours === 12) {
        hours = 0;
      }

      let targetTime = moment()
        .add(1, 'day')
        .hours(hours)
        .minutes(minutes)
        .seconds(0)
        .milliseconds(0);

      console.log('Current time:', now.format('YYYY-MM-DD HH:mm:ss'));
      console.log('Target time:', targetTime.format('YYYY-MM-DD HH:mm:ss'));

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Reminder',
          body: task.title,
          sound: true,
          priority: 'max'
        },
        trigger: {
          channelId: 'reminders',
          date: targetTime.toDate(),
        },
      });

      console.log(`Scheduled notification for ${task.title} at ${targetTime.format('YYYY-MM-DD HH:mm:ss')}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  };

  const reloadData = async () => {
    const storedTasks = await storage.getItem(TASKS_KEY);
    if (storedTasks) {
      const allTasks = JSON.parse(storedTasks);
      const tomorrow = moment().add(1, 'day').format('YYYY-MM-DD');
      const filtered = allTasks.filter(task => task.date === tomorrow);
      setTasks(filtered);
    }

    const storedToggle = await storage.getItem(TOGGLE_KEY);
    setRemoveAfterCompletion(storedToggle === 'true');
  };

  const clearReminders = async () => {
    await storage.deleteItem(TASKS_KEY);
    setTasks([]);
    reloadData();
  };

  const toggleSwitch = async () => {
    const newState = !removeAfterCompletion;
    setRemoveAfterCompletion(newState);
    await storage.setItem(TOGGLE_KEY, newState.toString());
  };

  // Modify toggleTask to cancel notification if task is completed
  const toggleTask = async (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const task = tasks.find(t => t.id === id);
    
    if (removeAfterCompletion) {
      if (task?.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(task.notificationId);
      }
      const updatedTasks = tasks.filter(task => task.id !== id);
      setTasks(updatedTasks);
      await saveTasks(updatedTasks);
      await syncDeleteReminder(id);
    } else {
      const isCompleted = !doneTasks.includes(id);
      setDoneTasks((prev) =>
        isCompleted ? [...prev, id] : prev.filter(taskId => taskId !== id)
      );
      await syncReminderStatus(id, isCompleted);
    }
  };

  const saveTasks = async (tomorrowTasks) => {
    try {
      // Get auth data from storage
      const authData = await storage.getAuthData();
      const user = authData?.user;
      const accessToken = authData?.accessToken;
      const tomorrow = moment().add(1, 'day').format('YYYY-MM-DD');
      
      // If user is logged in, save to Supabase first
      if (user && accessToken) {
        try {
          // Add user information to tasks before saving
          const tasksWithUser = tomorrowTasks.map(task => ({
            ...task,
            user_id: user.id,
            user_email: user.email,
            synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          
          // Save directly to Supabase
          const tasksToSave = tasksWithUser.map(task => ({
            id: task.id,
            title: task.title,
            time: task.time,
            date: task.date,
            completed: task.completed || false,
            user_id: user.id,
            notification_id: task.notificationId,
            synced_at: new Date().toISOString()
          }));
          
          console.log('Current user:', { 
            id: user.id, 
            email: user.email,
            accessToken: accessToken?.substring(0, 10) + '...' || 'missing'
          });
          console.log('Saving to Supabase:', JSON.stringify(tasksToSave, null, 2));
          
          const { error: upsertError, data } = await upsertReminders(tasksToSave, accessToken);
          console.log('Supabase response:', { data, error: upsertError });
          
          if (upsertError) {
            console.error('Detailed error:', upsertError);
            throw upsertError;
          }
          if (upsertError) throw upsertError;
        } catch (syncError) {
          console.error('Error saving to Supabase:', syncError);
          // Continue with local storage even if Supabase save fails
        }
      }

      // Always maintain local storage as offline fallback
      const storedTasks = await storage.getItem(TASKS_KEY);
      const allTasks = storedTasks ? JSON.parse(storedTasks) : [];
      const otherDaysTasks = allTasks.filter(task => task.date !== tomorrow);
      const newTasks = [...otherDaysTasks, ...tomorrowTasks];
      await storage.setItem(TASKS_KEY, JSON.stringify(newTasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (text.trim() === '') return;
    const currentTime = await storage.getItem(TIME_KEY) || selectedTime;
    
    const newTask = {
      id: Date.now().toString(),
      title: text.trim(),
      time: currentTime,
      date: moment().add(1, 'day').format('YYYY-MM-DD'),
      completed: false,
    };

    const notificationId = await scheduleNotification(newTask);
    if (notificationId) {
      newTask.notificationId = notificationId;
    }

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    setText('');
    setIsInputVisible(false);
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
            await syncDeleteReminder(id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
          }
        }
      ]
    );
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

  const getEmptyStateMessage = () => {
    if (tasks.length === 0) {
      return "tomorrow's looking pretty chill! \nmaybe add something? 🌴";
    }
    if (tasks.every(task => doneTasks.includes(task.id))) {
      return "planning ahead like a boss! \nall set for tomorrow! 🚀";
    }
    return null;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>tomorrow</Text>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Text style={[styles.settingsText, { color: colors.textSecondary }]}>settings</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          {tasks.map((task, index) => {
            const isCompleted = doneTasks.includes(task.id);
            return (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.task,
                  { backgroundColor: colors.cardBackground, borderColor: colors.border }
                ]}
                onPress={() => toggleTask(task.id)}
              >
                <View style={styles.taskContent}>
                  <Text style={[
                    styles.taskText,
                    { 
                      color: colors.text,
                      textDecorationLine: isCompleted ? 'line-through' : 'none',
                      opacity: isCompleted ? 0.5 : 1
                    }
                  ]}>
                    {task.title}
                  </Text>
                  <Text style={[
                    styles.timeText,
                    { 
                      color: colors.textSecondary,
                      opacity: isCompleted ? 0.5 : 1
                    }
                  ]}>
                    {task.time}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  borderColor: colors.border,
                  flex: 0.7,
                  marginRight: 10
                }
              ]}
              placeholder="add a reminder..."
              placeholderTextColor={colors.textSecondary}
              value={text}
              onChangeText={setText}
              onSubmitEditing={handleSubmit}
            />
            <TouchableOpacity
              style={[
                styles.timePickerButton,
                { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  flex: 0.3
                }
              ]}
              onPress={() => router.push('/timePicker')}
            >
              <Text style={[styles.timePickerText, { color: colors.text }]}>
                {selectedTime}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Nunito_800ExtraBold',
  },
  settingsText: {
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  task: {
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  taskContent: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskText: {
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    flex: 1,
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'Nunito_800ExtraBold',
    marginLeft: 10,
  },
  inputContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
  },
  timePickerButton: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerText: {
    fontSize: 14,
    fontFamily: 'Nunito_800ExtraBold',
  },
});
