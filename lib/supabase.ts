import 'react-native-url-polyfill/auto'; // MUST BE LINE 1
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://trnfhlmwmagsdhabswsl.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTc5NjUsImV4cCI6MjA4OTA3Mzk2NX0.k70D6gXb2eDF1raEodQFlk8vnQ5qNlw--fZVrMYmwwA';

console.log('Attempting to connect to:', process.env.EXPO_PUBLIC_SUPABASE_URL);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * getValidSession - Helper to retrieve and validate the current Supabase session
 * @returns {Promise<Session | null>} The current session or null if not found
 */
export const getValidSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('🔍 AUTH_HELPER: Session fetch error:', error);
      return null;
    }
    return session;
  } catch (err) {
    console.error('🔍 AUTH_HELPER: Unexpected session error:', err);
    return null;
  }
};
