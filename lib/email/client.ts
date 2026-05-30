import { Resend } from 'resend'
import { render } from '@react-email/render'
import type { ReactElement } from 'react'
import { BRAND_NAME } from '@/lib/brand'

export function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? `${BRAND_NAME} <onboarding@resend.dev>`
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim())
}

type SendEmailOptions = {
  to: string
  subject: string
  react: ReactElement
  headers?: Record<string, string>
}

export async function sendEmail({
  to,
  subject,
  react,
  headers,
}: SendEmailOptions): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping send:', subject, to)
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const resend = new Resend(apiKey)
    const html = await render(react)
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject,
      html,
      headers,
    })

    if (error) {
      console.error('[email] Resend error:', error)
      return { ok: false, error: error.message }
    }

    return { ok: true, id: data?.id }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown send error'
    console.error('[email] send failed:', message)
    return { ok: false, error: message }
  }
}
