// Re-export all functions from the split files for backwards compatibility
// with existing imports of '@/lib/supabase'.
//
// Server-only functions (createServerSupabaseClient, createMiddlewareClient,
// createServiceClient) require next/headers and must NOT be imported in client
// components. They are safe to use in Server Components, API routes, and
// middleware.
//
// Client-safe functions (createBrowserClient) can be used anywhere.

export { createServerSupabaseClient, createMiddlewareClient, createServiceClient } from './supabase.server'
export { createBrowserClient } from './supabase.client'
