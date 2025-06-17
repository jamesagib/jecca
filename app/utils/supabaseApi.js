import { supabaseUrl, supabaseAnonKey } from './supabaseConfig';
import moment from 'moment';

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
      notification_id: reminder.notification_id,
      synced_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      timezone: moment.tz.guess() // Add user's timezone
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

    const data = await res.json();

    // Schedule push notifications for each reminder
    for (const reminder of formattedReminders) {
      try {
        // Only schedule if not completed and has a future date/time
        if (!reminder.completed) {
          // Create a moment object in the user's timezone
          const userTimezone = reminder.timezone || moment.tz.guess();
          const reminderDate = moment.tz(
            reminder.date + ' ' + reminder.time,
            'YYYY-MM-DD h:mma',
            userTimezone
          );
          const now = moment().tz(userTimezone);
          
          if (reminderDate.isAfter(now)) {
            await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                reminder_id: reminder.id,
                user_id: reminder.user_id,
                timezone: userTimezone,
                scheduled_time: reminderDate.toISOString()
              }),
            });
          }
        }
      } catch (notificationError) {
        console.error('Error scheduling push notification:', notificationError);
        // Continue with other reminders even if one fails
      }
    }

    return { data, error: null };
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
export async function verifyOtp(email, token) {
  try {
    console.log('Starting OTP verification for:', email);
    
    const res = await fetch(`${supabaseUrl}/auth/v1/verify`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        token,
        type: 'magiclink',
        gotrue_meta_security: {}
      }),
    });

    const data = await res.json();
    console.log('Verify response:', {
      status: res.status,
      ok: res.ok,
      data
    });

    if (!res.ok) {
      console.error('Verification failed:', data);
      return { 
        data: null, 
        error: { message: data.error_description || data.error || 'Invalid code.' }
      };
    }

    // For successful verification, we should have both user and access_token
    if (!data.user || !data.access_token) {
      console.error('Invalid response structure:', data);
      return {
        data: null,
        error: { message: 'Invalid response from server - missing user or token' }
      };
    }

    // Return the data in the expected format
    return { 
      data: {
        user: data.user,
        session: {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: data.expires_in,
        }
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error in verifyOtp:', error);
    return { 
      data: null, 
      error: { message: error.message || 'Failed to verify code.' }
    };
  }
}

export async function sendOtp(email) {
  try {
    console.log('Sending OTP to:', email);
    
    const res = await fetch(`${supabaseUrl}/auth/v1/otp`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        type: 'magiclink',
        gotrue_meta_security: {},
        options: {
          data: {
            email
          }
        }
      }),
    });

    const data = await res.json();
    console.log('OTP send response:', {
      status: res.status,
      ok: res.ok,
      data
    });

    if (!res.ok) {
      console.error('Failed to send OTP:', data);
      return { 
        data: null, 
        error: { message: data.error_description || data.error || 'Failed to send code.' }
      };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { 
      data: null, 
      error: { message: error.message || 'Failed to send code.' }
    };
  }
}

export async function signInWithGoogleIdToken(idToken) {
  try {
    console.log('Starting Google sign in with Supabase...');
    
    // Add timeout to the fetch request
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=id_token&provider=google`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'google',
        id_token: idToken,
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    const data = await res.json();
    console.log('Supabase Google sign in response:', {
      status: res.status,
      ok: res.ok,
      error: data.error,
      error_description: data.error_description
    });

    if (!res.ok) {
      console.error('Supabase Google sign in failed:', data);
      return { 
        data: null, 
        error: { message: data.error_description || data.error || 'Failed to sign in with Google' }
      };
    }

    // Validate response data
    if (!data.user || !data.access_token) {
      console.error('Invalid response structure from Supabase:', data);
      return {
        data: null,
        error: { message: 'Invalid response from server - missing user or token' }
      };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in Google sign in:', error);
    if (error.name === 'AbortError') {
      return { 
        data: null, 
        error: { message: 'Sign in request timed out. Please try again.' }
      };
    }
    return { 
      data: null, 
      error: { message: error.message || 'Failed to sign in with Google' }
    };
  }
}

export async function cleanupReminders(userId, accessToken) {
  try {
    const timezone = moment.tz.guess(); // Get user's timezone
    const res = await fetch(
      `${supabaseUrl}/functions/v1/cleanup-reminders`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          timezone: timezone
        }),
      }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to cleanup reminders');
    }

    return { data: await res.json(), error: null };
  } catch (error) {
    console.error('Error cleaning up reminders:', error);
    return { data: null, error };
  }
} 