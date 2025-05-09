import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, LayoutAnimation } from 'react-native';
import { useFonts } from '@expo-google-fonts/nunito/useFonts';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import * as Haptics from 'expo-haptics';
import moment from 'moment';
import { useRouter } from 'expo-router';
const router = useRouter();

export default function TodayScreen() {

  let [fontsLoaded] = useFonts({
    Nunito_800ExtraBold, 
  });

  const defaultTASKS = [
    { id: 1, title: "pick up trash" },
    { id: 2, title: "throw away clothes" },
    { id: 3, title: "study for aps" },
    { id: 4, title: "wash dishes" },
    { id: 5, title: "charge chromebook" },
  ];
  
  const [selected, setSelected] = useState('today');
  const [doneTasks, setDoneTasks] = useState([]);
  const [text, setText] = useState('');
  const [tasks, setTasks] = useState(defaultTASKS);

  const tabs = ['today', 'tomorrow'];

  const toggleTask = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDoneTasks((prev) =>
      prev.includes(id) ? prev.filter(taskId => taskId !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (text.trim() === '') return;
    const newTask = { id: tasks.length + 1, title: text };
    setTasks([...tasks, newTask]); 
    setText(''); 
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to delete this task?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { text: "OK", onPress: () => deleteTask(id) }
      ]
    );
  };

  const deleteTask = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTasks(tasks.filter(task => task.id !== id));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={60} // Adjust offset to prevent bottom bar movement
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.dateText}>{moment().format('ddd. MMM D').toLowerCase()}</Text>
        </View>

        <View style={styles.listContainer}>
          {tasks.map((item) => (
            <TouchableOpacity key={item.id} onPress={() => toggleTask(item.id)}   onLongPress={() => handleDelete(item.id)}>
              <Text
                style={[
                  styles.reminderName,
                  { color: doneTasks.includes(item.id) ? "#212121" : "#CFCFCF" },
                ]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
          <TextInput 
            placeholderTextColor={"CFCFCF"}
            placeholder='+ add item...'
            style={styles.addItemInput}
            onChangeText={newText => setText(newText)}
            onSubmitEditing={handleSubmit} 
            value={text}
            autoCapitalize='none'
          />
        </View>

        <View style={styles.bottomBar}>
          {tabs.map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setSelected(tab)}>
              <Text
                style={[
                  styles.tabText,
                  selected === tab && styles.selectedText,
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
    gap: 14,
    paddingBottom: 60, // so content doesn’t hide behind the bottom bar
  },
  reminderName: {
    fontSize: 25,
    fontFamily: 'Nunito_800ExtraBold',
  },
  addItemInput: {
    fontSize: 25,
    fontFamily: 'Nunito_800ExtraBold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  tabText: {
    fontSize: 22,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#ccc',
  },
  selectedText: {
    color: '#000',
  },
});

