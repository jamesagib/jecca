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