import { getReminders, upsertReminders, updateReminderStatus, deleteReminder } from '../../utils/supabaseApi';
import { storage } from './storage';
import { useAuthStore } from './auth';

const TASKS_KEY = 'tasks';

// Helper function to merge reminders with conflict resolution
function mergeReminders(localReminders, remoteReminders) {
  const mergedMap = new Map();

  // Add all local reminders to the map
  localReminders.forEach(reminder => {
    mergedMap.set(reminder.id, {
      ...reminder,
      synced: false,
      completed: reminder.completed || false
    });
  });

  // Merge remote reminders, preferring newer synced_at timestamps
  remoteReminders.forEach(reminder => {
    const existing = mergedMap.get(reminder.id);
    if (!existing || (reminder.synced_at && (!existing.synced_at || new Date(reminder.synced_at) > new Date(existing.synced_at)))) {
      mergedMap.set(reminder.id, {
        ...reminder,
        synced: true,
        completed: reminder.completed || false
      });
    }
  });

  return Array.from(mergedMap.values());
}

export const syncReminders = async () => {
  const { user, accessToken } = useAuthStore.getState();
  if (!user || !accessToken) return;

  try {
    // Get local reminders
    const localReminders = await storage.getItem(TASKS_KEY);
    const parsedLocalReminders = localReminders ? JSON.parse(localReminders) : [];

    // Get remote reminders
    const { data: remoteReminders, error } = await getReminders(user.id, accessToken);
    if (error) throw error;

    // Merge reminders
    const mergedReminders = mergeReminders(parsedLocalReminders, remoteReminders || []);

    // Update local storage
    await storage.setItem(TASKS_KEY, JSON.stringify(mergedReminders));

    // Sync to remote
    const remindersToSync = mergedReminders.map(reminder => ({
      ...reminder,
      user_id: user.id,
      user_email: user.email
    }));

    const { error: upsertError } = await upsertReminders(remindersToSync, accessToken);
    if (upsertError) throw upsertError;

    return mergedReminders;
  } catch (error) {
    console.error('Error syncing reminders:', error);
    return null;
  }
};

export const syncReminderStatus = async (reminderId, completed) => {
  const { user, accessToken } = useAuthStore.getState();
  if (!user || !accessToken) return;

  try {
    const { error } = await updateReminderStatus(reminderId, user.id, completed, accessToken);
    if (error) throw error;

    // Update local storage
    const localReminders = await storage.getItem(TASKS_KEY);
    if (localReminders) {
      const parsedReminders = JSON.parse(localReminders);
      const updatedReminders = parsedReminders.map(reminder =>
        reminder.id === reminderId
          ? { ...reminder, completed, synced_at: new Date().toISOString() }
          : reminder
      );
      await storage.setItem(TASKS_KEY, JSON.stringify(updatedReminders));
    }
  } catch (error) {
    console.error('Error syncing reminder status:', error);
  }
};

export const syncDeleteReminder = async (reminderId) => {
  const { user, accessToken } = useAuthStore.getState();
  if (!user || !accessToken) return;

  try {
    const { error } = await deleteReminder(reminderId, user.id, accessToken);
    if (error) throw error;

    // Update local storage
    const localReminders = await storage.getItem(TASKS_KEY);
    if (localReminders) {
      const parsedReminders = JSON.parse(localReminders);
      const updatedReminders = parsedReminders.filter(reminder => reminder.id !== reminderId);
      await storage.setItem(TASKS_KEY, JSON.stringify(updatedReminders));
    }
  } catch (error) {
    console.error('Error syncing reminder deletion:', error);
  }
};