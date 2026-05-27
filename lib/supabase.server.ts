import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Server-component / Route Handler client — reads auth session from cookies.
 * Respects RLS. Use in Server Components and API routes.
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(URL, ANON, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (pairs) => {
        try {
          pairs.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // called from Server Component — safe to ignore
        }
      },
    },
  })
}

/**
 * Middleware client — refreshes tokens and writes response cookies.
 * Only used inside middleware.ts.
 */
export function createMiddlewareClient(request: NextRequest, response: NextResponse) {
  return createServerClient(URL, ANON, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (pairs) => {
        pairs.forEach(({ name, value }) => request.cookies.set(name, value))
        pairs.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })
}

/**
 * Service-role admin client — bypasses RLS entirely.
 * NEVER import in client components.
 */
export function createServiceClient() {
  return createClient(URL, SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
