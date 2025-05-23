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
import { Audio } from 'expo-av';
import moment from 'moment';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { storage } from '../utils/storage';
import { useAuthStore } from '../utils/auth';
import { scheduleNotificationWithSupabase } from '../utils/notifications';
import { syncReminders, syncDeleteReminder, syncReminderStatus } from '../utils/sync';
import { upsertReminders, cleanupReminders } from '../utils/supabaseApi';
// import VoiceRecorder from '../components/VoiceRecorder';
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

export default function TomorrowScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const removeAfterCompletion = useSettingsStore(state => state.removeAfterCompletion);
  const loadSettings = useSettingsStore(state => state.loadSettings);

  const [tasks, setTasks] = useState([]);
  const [doneTasks, setDoneTasks] = useState([]);
  const [text, setText] = useState('');
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
      
      if (storedTime) {
        setSelectedTime(storedTime);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    loadSettings();
  }, []);

  // Single useFocusEffect for all state updates
  useFocusEffect(
    useCallback(() => {
      const updateState = async () => {
        const { user, accessToken } = useAuthStore.getState();
        
        // Clean up reminders if user is logged in
        if (user && accessToken) {
          await cleanupReminders(user.id, accessToken);
        }
        
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
  };

  const clearReminders = async () => {
    await storage.deleteItem(TASKS_KEY);
    setTasks([]);
    reloadData();
  };

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
          // Transform all tasks for Supabase
          const tasksToSave = tomorrowTasks.map(task => ({
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
      id: uuidv4(),
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
      return "planning ahead like a boss! \nall set for tomorrow! ��";
    }
    return null;
  };

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          interruptionModeIOS: 1,  // Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS
          interruptionModeAndroid: 1,  // Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false
        });
      } catch (error) {
        console.error('Error setting up audio:', error);
      }
    };
    setupAudio();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.dateText}>
              {moment().add(1, 'day').format('dddd MMM D').toLowerCase()}
            </Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/settings')}
            >
              <Text style={styles.settingsText}>settings</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.content}>
          <View style={styles.taskListContainer}>
            {tasks.map((task, index) => {
              const isCompleted = doneTasks.includes(task.id);
              return (
                <TouchableOpacity
                  key={task.id}
                  style={styles.task}
                  onPress={() => toggleTask(task.id)}
                  onLongPress={() => handleDelete(task.id)}
                >
                  <View style={styles.taskTextContainer}>
                    <Text style={[
                      styles.taskText,
                      { color: doneTasks.includes(task.id) ? '#000000' : '#CFCFCF' }
                    ]}>
                      {task.title}
                    </Text>
                    <View style={styles.timeContainer}>
                      <Text style={[
                        styles.timeText,
                        { color: doneTasks.includes(task.id) ? '#000000' : '#CFCFCF' }
                      ]}>
                        {task.time}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
            
            {/* Add Item as part of the list */}
            <View style={styles.task}>
              <View style={styles.taskInputContainer}>
                <TextInput
                  style={styles.taskText}
                  placeholder="+ add item..."
                  placeholderTextColor="#CFCFCF"
                  value={text}
                  onChangeText={setText}
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity 
                  style={styles.timeContainer}
                  onPress={() => router.push('/timePicker')}
                >
                  <Text style={[styles.timeText, { color: '#CFCFCF' }]}>
                    {selectedTime}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* <VoiceRecorder 
            onRecordingComplete={async (transcribedText) => {
              // Create a new task with the transcribed text
              const newTask = {
                id: uuidv4(),
                title: transcribedText,
                time: selectedTime,
                date: moment().add(1, 'day').format('YYYY-MM-DD'),
                completed: false
              };
              
              // Add to tasks list
              const updatedTasks = [...tasks, newTask];
              setTasks(updatedTasks);
              
              // Save to storage and sync
              await storage.setItem(TASKS_KEY, JSON.stringify(updatedTasks));
              await syncReminders();
              
              // Schedule notification if needed
              await scheduleNotification(newTask);
            }}
          /> */}
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={styles.tab}
            onPress={() => router.push('/tabs/today')}
          >
            <Text style={[styles.tabText, { color: '#CFCFCF' }]}>today</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={[styles.tabText, { color: '#000000' }]}>tomorrow</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  dateText: {
    fontSize: 24,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#000000',
  },
  settingsButton: {
    padding: 8,
  },
  settingsText: {
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskListContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  task: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
  },
  taskTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  taskText: {
    fontSize: 22,
    fontFamily: 'Nunito_800ExtraBold',
    textAlign: 'center',
    color: '#000000',
  },
  timeContainer: {
    borderWidth: 1,
    borderColor: '#CFCFCF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  timeText: {
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    textAlign: 'center',
    color: '#000000',
  },
  taskInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    justifyContent: 'center',
  },
  tab: {
    marginHorizontal: 10,
  },
  tabText: {
    fontSize: 25,
    fontFamily: 'Nunito_800ExtraBold',
  },
});
