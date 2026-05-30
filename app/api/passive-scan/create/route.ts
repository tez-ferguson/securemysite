import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { triggerPassiveScan } from '@/lib/modal'
import { normalizeSiteUrl } from '@/lib/url'
import { z } from 'zod'

const schema = z.object({
  url: z.string().min(1),
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const url = normalizeSiteUrl(parsed.data.url)
  try {
    new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: row, error } = await supabase
    .from('passive_scans')
    .insert({
      url,
      email: parsed.data.email.toLowerCase().trim(),
      status: 'queued',
    })
    .select('token')
    .single()

  if (error || !row) {
    console.error('passive_scans insert failed:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  const token = row.token as string
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const callbackUrl = `${appUrl}/api/passive-scan/${token}/callback`
  const callbackSecret = process.env.SCANNER_CALLBACK_SECRET
  if (!callbackSecret) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  try {
    await triggerPassiveScan({ token, url, callbackUrl, callbackSecret })
    await supabase.from('passive_scans').update({ status: 'running' }).eq('token', token)
  } catch (err) {
    console.error('Passive Modal trigger failed:', err)
    await supabase.from('passive_scans').update({ status: 'failed' }).eq('token', token)
  }

  return NextResponse.json({ token })
}
