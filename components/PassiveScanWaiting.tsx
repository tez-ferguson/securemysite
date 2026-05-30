'use client'

import { useCallback, useEffect, useState } from 'react'

type PollPayload = {
  status: string
  totalCount?: number
  errorMessage?: string | null
}

interface PassiveScanWaitingProps {
  token: string
  siteUrl: string
  onReady: (payload: PollPayload) => void
}

export default function PassiveScanWaiting({ token, siteUrl, onReady }: PassiveScanWaitingProps) {
  const [message, setMessage] = useState('Finishing your scan on our servers…')
  const [dots, setDots] = useState(0)
  const [stuckHint, setStuckHint] = useState(false)
  const startedAt = useState(() => Date.now())[0]

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/passive-scan/${token}/status?_=${Date.now()}`, {
        cache: 'no-store',
      })
      if (!res.ok) return
      const data = (await res.json()) as PollPayload & { error?: string }
      if (data.error) return
      if (data.status === 'failed') {
        setMessage(data.errorMessage ?? 'Scan could not finish')
        onReady(data)
        return
      }
      if (data.status === 'complete') {
        onReady(data)
        return
      }
      if (Date.now() - startedAt > 90_000) {
        setStuckHint(true)
        setMessage('Still saving results — this usually finishes within 2 minutes')
      }
    } catch { /* retry */ }
  }, [token, onReady, startedAt])

  useEffect(() => {
    poll()
    const pollInterval = setInterval(poll, 2000)
    const dotInterval = setInterval(() => setDots((d) => (d + 1) % 4), 500)
    return () => {
      clearInterval(pollInterval)
      clearInterval(dotInterval)
    }
  }, [poll])

  const host = siteUrl.replace(/^https?:\/\//i, '')

  return (
    <main
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: '12px' }}>
        {host}
      </p>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 400, marginBottom: '12px' }}>
        Almost there
      </h1>
      <p style={{ color: 'var(--ink3)', fontWeight: 300, maxWidth: '400px', lineHeight: 1.55 }}>
        {message}
        {'.'.repeat(dots)}
      </p>
      <p style={{ marginTop: '20px', fontSize: '0.78rem', color: 'var(--ink4)' }}>
        This page will update automatically — no need to refresh.
      </p>
      {stuckHint ? (
        <p style={{ marginTop: '24px', fontSize: '0.8rem', color: 'var(--ink3)', maxWidth: '420px', lineHeight: 1.55 }}>
          If this lasts more than a few minutes, the last scan may be stuck. After deploying the latest app,
          start a <a href="/" style={{ color: 'var(--ink)' }}>new scan</a> — older links won&apos;t recover on their own.
        </p>
      ) : null}
    </main>
  )
}
