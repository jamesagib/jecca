import { useEffect, useState } from 'react';
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
import { useFonts } from '@expo-google-fonts/nunito/useFonts';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import moment from 'moment';
import { useRouter } from 'expo-router';

export default function TomorrowScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold,
  });

  const [tasks, setTasks] = useState([]);
  const [doneTasks, setDoneTasks] = useState([]);
  const [text, setText] = useState('');
  const [removeAfterCompletion, setRemoveAfterCompletion] = useState(false);
  const tabs = ['today', 'tomorrow'];

  const STORAGE_KEY = 'reminders_tomorrow';
  const DATE_KEY = 'reminders_tomorrow_date';
  const TOGGLE_KEY = 'remove_reminder_toggle';

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

  const toggleTask = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (removeAfterCompletion) {
      const updatedTasks = tasks.filter(task => task.id !== id);
      setTasks(updatedTasks);
      SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(updatedTasks));
    } else {
      setDoneTasks((prev) =>
        prev.includes(id) ? prev.filter(taskId => taskId !== id) : [...prev, id]
      );
    }
  };

  const handleSubmit = () => {
    if (text.trim() === '') return;
    const newTask = {
      id: Date.now().toString(),
      title: text,
      time: moment().add(1, 'day').format('hA'),
    };
    setTasks([...tasks, newTask]);
    setText('');
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to delete this task?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setTasks(tasks.filter(task => task.id !== id));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
          }
        }
      ]
    );
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
            <TouchableOpacity style={styles.inputTimeContainer}>
              <Text style={styles.timeText}>7am</Text>
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
    width: 'auto',
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
    width: '15%',
    height: 25,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginLeft: 10,
    justifyContent: 'center',
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
