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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (!appUrl) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const modalPassiveUrl = process.env.MODAL_PASSIVE_FUNCTION_URL?.trim()
  if (!modalPassiveUrl) {
    await supabase
      .from('passive_scans')
      .update({ status: 'failed', error_message: 'MODAL_PASSIVE_FUNCTION_URL not set on server' })
      .eq('token', token)
    return NextResponse.json({ error: 'Scanner not configured on server' }, { status: 502 })
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
    const message = err instanceof Error ? err.message : 'Scanner trigger failed'
    await supabase
      .from('passive_scans')
      .update({ status: 'failed', error_message: message.slice(0, 500) })
      .eq('token', token)
    return NextResponse.json(
      {
        error: message.includes('401') || message.includes('Unauthorized')
          ? 'Scanner secret mismatch — check SCANNER_CALLBACK_SECRET matches Modal APP_CALLBACK_SECRET'
          : message.includes('MODAL_PASSIVE')
            ? 'Scanner not configured on server'
            : 'Could not start scan',
      },
      { status: 502 },
    )
  }

  return NextResponse.json({ token })
}
