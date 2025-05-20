import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// --- AUTH ---
export async function signInWithPassword(email, password) {
  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function signUpWithEmail(email, password) {
  const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function signInWithGoogleIdToken(idToken) {
  // See: https://supabase.com/docs/guides/auth/social-login/auth-google#sign-in-using-an-id-token
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
  });
  return res.json();
}

// --- OTP AUTH (REST API) ---
export async function sendOtp(email) {
  const body = JSON.stringify({
    email,
    type: 'email', // Required for OTP code (keep this)
  });
  console.log('OTP Request Body:', body);
  const res = await fetch(`${supabaseUrl}/auth/v1/otp`, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body,
  });
  const data = await res.json();
  console.log('OTP API response:', data);
  if (!res.ok) {
    return { data: null, error: { message: data.error_description || data.error || 'Failed to send code.' } };
  }
  return { data, error: null };
}

export async function verifyOtp(email, token) {
  const res = await fetch(`${supabaseUrl}/auth/v1/verify`, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, token, type: 'email' }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { data: null, error: { message: data.error_description || data.error || 'Invalid code.' } };
  }
  return { data, error: null };
}

// --- DATABASE ---
export async function getReminders(userId, accessToken) {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/reminders?user_id=eq.${userId}&order=created_at.desc`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to fetch reminders');
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return { data: null, error };
  }
}

export async function upsertReminders(reminders, accessToken) {
  try {
    // Transform reminders to match database schema
    const transformedReminders = reminders.map(reminder => ({
      id: reminder.id,
      title: reminder.title,
      time: reminder.time,
      date: reminder.date,
      user_id: reminder.user_id,
      notification_id: reminder.notificationId,
      completed: reminder.completed || false,
      synced_at: new Date().toISOString(),
    }));

    const res = await fetch(`${supabaseUrl}/rest/v1/reminders`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(transformedReminders),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to sync reminders');
    }

    return { data: await res.json(), error: null };
  } catch (error) {
    console.error('Error upserting reminders:', error);
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
          'Prefer': 'return=minimal',
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