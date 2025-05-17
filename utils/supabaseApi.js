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

// --- DATABASE ---
export async function getReminders(userId, accessToken) {
  const res = await fetch(`${supabaseUrl}/rest/v1/reminders?user_id=eq.${userId}`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  return res.json();
}

export async function upsertReminders(reminders, accessToken) {
  const res = await fetch(`${supabaseUrl}/rest/v1/reminders`, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(reminders),
  });
  return res.json();
} 