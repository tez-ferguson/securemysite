import { createClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Browser/client-side Supabase client (anon key, respects RLS).
 * Safe to call in 'use client' components.
 */
export function createBrowserClient() {
  return createClient(URL, ANON)
}
