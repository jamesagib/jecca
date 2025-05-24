import Constants from 'expo-constants';

// Supabase configuration
export const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
export const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

// Export a function to get config that ensures values are available
export function getSupabaseConfig() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration is missing. Please check your environment variables.');
  }
  return { supabaseUrl, supabaseAnonKey };
}

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration.');
}

// Add security warning for development
if (__DEV__) {
  console.log('Using development Supabase configuration. Make sure to set up environment variables for production.');
} 