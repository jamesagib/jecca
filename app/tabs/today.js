import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, LayoutAnimation } from 'react-native';
import { useFonts } from '@expo-google-fonts/nunito/useFonts';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import * as Haptics from 'expo-haptics';
import moment from 'moment';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { WheelPicker } from 'react-native-wheel-picker-expo';

const STORAGE_KEY = 'reminders';

export default function TodayScreen() {
  const router = useRouter();

  let [fontsLoaded] = useFonts({ Nunito_800ExtraBold });

  const [selected, setSelected] = useState('today');
  const [doneTasks, setDoneTasks] = useState([]);
  const [text, setText] = useState('');
  const [tasks, setTasks] = useState([]);

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

  const toggleTask = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDoneTasks((prev) =>
      prev.includes(id) ? prev.filter(taskId => taskId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (text.trim() === '') return;
    const newTask = {
      id: Date.now(),
      title: text,
      time: '7am',
      date: moment().format('YYYY-MM-DD'),
    };
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
    const updated = tasks.filter(task => task.id !== id);
    setTasks(updated);
    await saveTasks(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
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
            <TouchableOpacity style={styles.inputTimeContainer}>
              <Text style={styles.timeText}>7am</Text>
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
    gap: 25,
    paddingBottom: 60,
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  reminderName: {
    fontSize: 25,
    fontFamily: 'Nunito_800ExtraBold',
  },
  timeContainer: {
    width: '13%',
    height: 25,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    marginLeft: 10
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'Nunito_800ExtraBold',
    textAlign: 'center',
    lineHeight: 22,
    padding: 1,
  },
  newItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addItemInput: {
    fontSize: 25,
    fontFamily: 'Nunito_800ExtraBold',
  },
  inputTimeContainer: {
    width: '13%',
    height: 25,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginLeft: 10
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
