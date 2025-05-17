import { getReminders, upsertReminders } from '../../utils/supabaseApi';
import { storage } from './storage';
import { useAuthStore } from './auth';

export const syncReminders = async () => {
  const { user, accessToken } = useAuthStore.getState();
  if (!user || !accessToken) return;

  try {
    // Get local reminders
    const localReminders = await storage.getItem('tasks');
    const parsedLocalReminders = localReminders ? JSON.parse(localReminders) : [];

    // Get remote reminders
    const remoteReminders = await getReminders(user.id, accessToken);

    // Merge reminders, preferring local ones in case of conflict
    const mergedReminders = mergeReminders(parsedLocalReminders, remoteReminders);

    // Update local storage with merged reminders
    await storage.setItem('tasks', JSON.stringify(mergedReminders));

    // Update remote storage with user email
    await upsertReminders(
      mergedReminders.map(reminder => ({
        ...reminder,
        user_id: user.id,
        user_email: user.email,
        synced_at: new Date().toISOString()
      })),
      accessToken
    );

    return mergedReminders;
  } catch (error) {
    console.error('Error syncing reminders:', error);
    return null;
  }
};

const mergeReminders = (local, remote) => {
  const merged = [...local];
  
  remote.forEach(remoteReminder => {
    const localIndex = local.findIndex(l => l.id === remoteReminder.id);
    if (localIndex === -1) {
      // Keep user email when adding remote reminders
      merged.push({
        ...remoteReminder,
        user_email: remoteReminder.user_email
      });
    }
    // Local reminder takes precedence if it exists
  });

  return merged;
};