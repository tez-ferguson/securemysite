import { getCallbackAppUrl } from '@/lib/url'

export function getAppOrigin(): string | undefined {
  return getCallbackAppUrl() ?? process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
}

export function reportUrl(token: string): string {
  const base = getAppOrigin()
  if (!base) return `/scan/${token}`
  return `${base}/scan/${token}`
}

export function unlockUrl(token: string): string {
  return `${reportUrl(token)}`
}

export function homeUrl(): string {
  const base = getAppOrigin()
  return base ?? '/'
}

export function unsubscribeUrl(unsubscribeToken: string): string {
  const base = getAppOrigin()
  if (!base) return `/unsubscribe?token=${unsubscribeToken}`
  return `${base}/unsubscribe?token=${unsubscribeToken}`
}

export function displayHost(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/\/$/, '')
}
