import { supabaseUrl, supabaseAnonKey } from './supabaseConfig';

// --- PUSH NOTIFICATIONS ---
export async function savePushToken(userId, pushToken, deviceId, accessToken) {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/push_tokens`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        user_id: userId,
        push_token: pushToken,
        device_id: deviceId,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to save push token');
    }

    return { data: await res.json(), error: null };
  } catch (error) {
    console.error('Error saving push token:', error);
    return { data: null, error };
  }
}

export async function deletePushToken(userId, pushToken, accessToken) {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/push_tokens?user_id=eq.${userId}&push_token=eq.${pushToken}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to delete push token');
    }

    return { data: true, error: null };
  } catch (error) {
    console.error('Error deleting push token:', error);
    return { data: null, error };
  }
}

export async function scheduleReminder(reminderId, userId, accessToken) {
  try {
    const res = await fetch(
      `${supabaseUrl}/functions/v1/send-push-notification`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reminder_id: reminderId,
          user_id: userId,
        }),
      }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to schedule reminder');
    }

    return { data: await res.json(), error: null };
  } catch (error) {
    console.error('Error scheduling reminder:', error);
    return { data: null, error };
  }
}

// --- REMINDERS ---
export async function getReminders(userId, accessToken) {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/reminders?user_id=eq.${userId}&select=*`,
      {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to get reminders');
    }

    return { data: await res.json(), error: null };
  } catch (error) {
    console.error('Error getting reminders:', error);
    return { data: null, error };
  }
}

export async function upsertReminders(reminders, accessToken) {
  try {
    if (!accessToken) {
      console.error('No access token provided for Supabase request');
      return { data: null, error: new Error('No access token') };
    }

    console.log('Making Supabase request with:', {
      url: `${supabaseUrl}/rest/v1/reminders`,
      hasAccessToken: !!accessToken,
      tokenPreview: accessToken.substring(0, 10) + '...',
      reminderCount: reminders.length,
      firstReminder: reminders[0]
    });

    const formattedReminders = reminders.map(reminder => ({
      id: reminder.id,
      title: reminder.title,
      time: reminder.time,
      date: reminder.date,
      completed: reminder.completed || false,
      user_id: reminder.user_id,
      notification_id: reminder.notification_id, // Using the correct field name
      synced_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    console.log('Formatted reminders:', JSON.stringify(formattedReminders, null, 2));

    const res = await fetch(`${supabaseUrl}/rest/v1/reminders`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation,resolution=merge-duplicates',
      },
      body: JSON.stringify(formattedReminders),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('Supabase error response:', error);
      throw new Error(error.message || 'Failed to upsert reminders');
    }

    return { data: await res.json(), error: null };
  } catch (error) {
    console.error('Error upserting reminders:', error);
    return { data: null, error };
  }
}

export async function updateReminderStatus(reminderId, userId, completed, accessToken) {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/reminders?id=eq.${reminderId}&user_id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed,
          updated_at: new Date().toISOString(),
        }),
      }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to update reminder status');
    }

    return { data: true, error: null };
  } catch (error) {
    console.error('Error updating reminder status:', error);
    return { data: null, error };
  }
}

export async function deleteReminder(reminderId, userId, accessToken) {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/reminders?id=eq.${reminderId}&user_id=eq.${userId}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to delete reminder');
    }

    return { data: true, error: null };
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return { data: null, error };
  }
}

// --- AUTH ---
export async function sendOtp(email) {
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/signin`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        options: {
          data: {
            type: 'otp'
          }
        }
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to send OTP');
    }

    return { data: await res.json(), error: null };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { data: null, error };
  }
}

export async function verifyOtp(email, token) {
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/verify`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        token,
        type: 'email'
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to verify OTP');
    }

    return { data: await res.json(), error: null };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { data: null, error };
  }
} 