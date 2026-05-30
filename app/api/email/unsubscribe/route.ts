import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim()
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('passive_scans')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('unsubscribe_token', token)
    .select('email')
    .maybeSingle()

  if (error) {
    console.error('Unsubscribe failed:', error)
    return NextResponse.json({ error: 'Could not unsubscribe' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
  }

  const base = req.nextUrl.origin
  return NextResponse.redirect(`${base}/unsubscribe?done=1`)
}

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim()
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('passive_scans')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('unsubscribe_token', token)
    .select('email')
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: 'Could not unsubscribe' }, { status: error ? 500 : 404 })
  }

  return NextResponse.json({ ok: true })
}
