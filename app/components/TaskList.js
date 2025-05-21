import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Pressable } from 'react-native';
import { format } from 'date-fns';

export const TaskList = ({ todayTasks = [], tomorrowTasks = [] }) => {
  const [showTomorrow, setShowTomorrow] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const tasks = showTomorrow ? tomorrowTasks : todayTasks;
  
  const dateString = format(new Date(), 'EEE. MMM d').toLowerCase();

  return (
    <View style={styles.container}>
      <Text style={styles.dateHeader}>{dateString}</Text>

      <View style={styles.content}>
        <View style={styles.taskList}>
          {tasks.map((task, index) => (
            <View key={index} style={styles.taskRow}>
              <Text style={styles.taskText}>{task.title}</Text>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>
                  {format(new Date(task.date), 'h:mmaaa')}
                </Text>
              </View>
            </View>
          ))}
          {tasks.length === 0 && (
            <Text style={styles.emptyState}>
              {showTomorrow ? "You're all set for tomorrow!" : "No tasks for today!"}
            </Text>
          )}
        </View>

        <View style={styles.addItemContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="+ add item..."
              placeholderTextColor="#999"
              value={newTaskText}
              onChangeText={setNewTaskText}
            />
            <TouchableOpacity style={styles.timePickerButton}>
              <Text style={styles.timeText}>2:00pm</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputUnderline} />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.footerTab, !showTomorrow && styles.activeFooterTab]} 
          onPress={() => setShowTomorrow(false)}
        >
          <Text style={[styles.footerText, !showTomorrow && styles.activeFooterText]}>
            today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.footerTab, showTomorrow && styles.activeFooterTab]}
          onPress={() => setShowTomorrow(true)}
        >
          <Text style={[styles.footerText, showTomorrow && styles.activeFooterText]}>
            tomorrow
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
  },
  dateHeader: {
    fontSize: 24,
    color: '#000',
    paddingHorizontal: 20,
    marginBottom: 30,
    fontWeight: '400',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  taskList: {
    marginBottom: 20,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  taskText: {
    fontSize: 22,
    color: '#999',
    flex: 1,
  },
  timeContainer: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    marginLeft: 10,
  },
  timeText: {
    fontSize: 14,
    color: '#999',
  },
  emptyState: {
    textAlign: 'center',
    color: '#999',
    fontSize: 18,
    marginTop: 20,
  },
  addItemContainer: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#000',
    paddingVertical: 8,
  },
  timePickerButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    marginLeft: 10,
  },
  inputUnderline: {
    height: 1,
    backgroundColor: '#000',
    width: '100%',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 0,
    paddingBottom: 30,
  },
  footerTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
  },
  activeFooterTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  footerText: {
    fontSize: 16,
    color: '#999',
  },
  activeFooterText: {
    color: '#000',
  },
}); 