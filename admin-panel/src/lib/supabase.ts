import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY

// Standard client for auth and regular queries
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client for sensitive admin operations (delete users, etc.)
// ⚠️ ONLY use this in the admin panel, NEVER in the mobile app.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
