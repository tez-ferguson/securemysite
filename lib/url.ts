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
