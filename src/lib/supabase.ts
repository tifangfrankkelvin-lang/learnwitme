// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// These values come from our .env file.
// NEVER hardcode these directly — keeping them in .env
// means they stay secret and out of version control (Git).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// This creates a single Supabase client instance that we'll
// import and reuse across the entire app whenever we need
// to talk to the database or handle authentication.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,   // Keeps the user logged in by refreshing their token automatically
    persistSession: true,     // Saves the session to localStorage so users stay logged in on refresh
    detectSessionInUrl: true, // Needed for Google OAuth — reads the token from the URL after redirect
  },
})