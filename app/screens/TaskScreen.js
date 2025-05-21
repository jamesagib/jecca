import React from 'react';
import { StyleSheet, SafeAreaView, StatusBar, View } from 'react-native';
import { TaskList } from '../components/TaskList';
import useTaskStore from '../store/taskStore';

export const TaskScreen = () => {
  const getTodayTasks = useTaskStore(state => state.getTodayTasks);
  const getTomorrowTasks = useTaskStore(state => state.getTomorrowTasks);

  const todayTasks = getTodayTasks();
  const tomorrowTasks = getTomorrowTasks();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <TaskList
          todayTasks={todayTasks}
          tomorrowTasks={tomorrowTasks}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
}); 