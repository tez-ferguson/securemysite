import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase.server'

// Explicitly public (anonymous passive scan flow)
const PUBLIC_PREFIXES = ['/scan/', '/api/passive-scan/']

const PROTECTED = [
  /^\/dashboard/,
  /^\/report\//,
  /^\/github\/callback/,
  /^\/api\/scans\//,
  /^\/api\/payments\/checkout/,
  /^\/api\/github\/installations/,
  /^\/api\/github\/install/,
]

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })
  const supabase = createMiddlewareClient(request, response)

  // Refresh session if expired — keeps the cookie up to date
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isExplicitlyPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  const isProtected = !isExplicitlyPublic && PROTECTED.some((re) => re.test(pathname))

  if (isProtected && !user) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('redirect_url', pathname)
    return NextResponse.redirect(signInUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
