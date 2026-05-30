/**
 * Origin used for scanner callbacks. Must hit the API without redirects dropping the POST body.
 * Set CALLBACK_APP_URL if it differs from NEXT_PUBLIC_APP_URL (e.g. www vs apex).
 */
export function getCallbackAppUrl(): string | undefined {
  const explicit = process.env.CALLBACK_APP_URL?.replace(/\/$/, '')
  if (explicit) return explicit

  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (!base) return undefined

  try {
    const u = new URL(base)
    // Live site: apex → www 307; call www directly so Modal callbacks succeed
    if (u.hostname === 'ismysitesecure.ai') {
      u.hostname = 'www.ismysitesecure.ai'
      return u.origin
    }
  } catch {
    return base
  }
  return base
}

/** Ensure `https://host` URL for validators and scanners. */
export function normalizeSiteUrl(input: string): string {
  const t = input.trim()
  if (!t) return t
  if (/^https?:\/\//i.test(t)) return t
  return `https://${t}`
}

/** Base64 JSON for GitHub App installation `state` query param (browser-safe). */
export function encodeGithubInstallState(obj: { siteUrl: string }): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
}
