import { createClient } from '@supabase/supabase-js'

// These will be your Supabase project credentials
// You'll get these when you create your Supabase project
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Create a single supabase client for interacting with your database
// If no credentials provided, create a dummy client that won't throw errors
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
