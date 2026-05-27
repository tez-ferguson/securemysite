import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase.server'

/**
 * Call in API Route Handlers to get the authenticated user ID.
 * Returns userId on success, or a 401 NextResponse to return directly.
 *
 * Usage:
 *   const result = await requireAuth()
 *   if (result instanceof NextResponse) return result
 *   const { userId } = result
 */
export async function requireAuth(): Promise<{ userId: string } | NextResponse> {
  const supabase = createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return { userId: user.id }
}

/**
 * Get user email for a given user ID via the Supabase admin client.
 * Used in the scan callback to send completion emails.
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  const { createServiceClient } = await import('@/lib/supabase')
  const supabase = createServiceClient()
  const { data, error } = await supabase.auth.admin.getUserById(userId)
  if (error || !data?.user) return null
  return data.user.email ?? null
}
