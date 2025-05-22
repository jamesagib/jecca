import { create } from 'zustand';
import { addDays, startOfDay, isSameDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

const useTaskStore = create((set, get) => ({
  tasks: [],
  
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, { ...task, id: uuidv4() }]
  })),
  
  removeTask: (taskId) => set((state) => ({
    tasks: state.tasks.filter(task => task.id !== taskId)
  })),
  
  updateTask: (taskId, updates) => set((state) => ({
    tasks: state.tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    )
  })),
  
  getTodayTasks: () => {
    const today = startOfDay(new Date());
    return get().tasks.filter(task => 
      isSameDay(new Date(task.date), today)
    );
  },
  
  getTomorrowTasks: () => {
    const tomorrow = startOfDay(addDays(new Date(), 1));
    return get().tasks.filter(task => 
      isSameDay(new Date(task.date), tomorrow)
    );
  },
}));

export default useTaskStore; 