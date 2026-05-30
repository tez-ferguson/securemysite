// Required environment variables:
// MODAL_FUNCTION_URL=   (Modal web URL for `trigger_scan`, e.g. https://... modal.run)
// SCANNER_CALLBACK_SECRET=  (must match Modal secret `app-callback-secret` → APP_CALLBACK_SECRET)

export async function triggerScan(params: {
  scanJobId: string
  repoUrl: string
  githubInstallationId: string
  callbackUrl: string
  callbackSecret: string
  githubToken: string
}) {
  const res = await fetch(process.env.MODAL_FUNCTION_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-trigger-secret': process.env.SCANNER_CALLBACK_SECRET!,
    },
    body: JSON.stringify({
      scan_job_id: params.scanJobId,
      repo_url: params.repoUrl,
      github_installation_id: params.githubInstallationId,
      callback_url: params.callbackUrl,
      callback_secret: params.callbackSecret,
      github_token: params.githubToken,
    }),
  })

  if (!res.ok) {
    throw new Error(`Modal trigger failed: ${res.status} ${await res.text()}`)
  }

  return res.json() as Promise<{ queued?: boolean }>
}

function friendlyModalError(status: number, body: string): string {
  const lower = body.toLowerCase()
  if (status === 401 || lower.includes('unauthorized')) {
    return 'Scanner secret mismatch — Vercel SCANNER_CALLBACK_SECRET must match Modal APP_CALLBACK_SECRET'
  }
  if (status === 404) {
    return 'Modal URL not found — check MODAL_PASSIVE_FUNCTION_URL in Vercel (redeploy passive.py and paste the new URL)'
  }
  if (status >= 500) {
    return 'Modal scanner error — check Modal dashboard logs'
  }
  const snippet = body.slice(0, 120).replace(/\s+/g, ' ')
  return `Modal returned ${status}${snippet ? `: ${snippet}` : ''}`
}

export async function triggerPassiveScan(params: {
  token: string
  url: string
  callbackUrl: string
  callbackSecret: string
}) {
  const url = process.env.MODAL_PASSIVE_FUNCTION_URL?.trim()
  if (!url) {
    throw new Error('MODAL_PASSIVE_FUNCTION_URL is not configured')
  }

  const triggerSecret = process.env.SCANNER_CALLBACK_SECRET?.trim()
  if (!triggerSecret) {
    throw new Error('SCANNER_CALLBACK_SECRET is not configured')
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-trigger-secret': triggerSecret,
    },
    body: JSON.stringify({
      token: params.token,
      url: params.url,
      callback_url: params.callbackUrl,
      callback_secret: params.callbackSecret,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(friendlyModalError(res.status, body))
  }

  return res.json() as Promise<{ queued?: boolean }>
}
