import { createServerSupabaseClient } from '@/lib/supabase.server'
import { NextRequest, NextResponse } from 'next/server'

/** Only allow relative paths to prevent open-redirect attacks. */
function safeRedirectPath(next: string | null): string {
  if (!next) return '/dashboard'
  // Must start with '/' and not be a protocol-relative URL (//host/...)
  if (next.startsWith('/') && !next.startsWith('//')) return next
  return '/dashboard'
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeRedirectPath(searchParams.get('next'))

  if (code) {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`)
}
