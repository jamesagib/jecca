// Supabase configuration
export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wpwigqaywssygbksbhfh.supabase.co';
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwd2lncWF5d3NzeWdia3NiaGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MzY1MjEsImV4cCI6MjA2MzAxMjUyMX0.bo-5nIz8x_tcnMwpcEuBocz8iH2worvM8m5by0HFWYY';

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration.');
}

// Add security warning for development
if (process.env.NODE_ENV === 'development') {
  console.log('Using development Supabase configuration. Make sure to set up environment variables for production.');
} 