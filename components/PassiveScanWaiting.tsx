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

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/passive-scan/${token}/status`)
      if (!res.ok) return
      const data = (await res.json()) as PollPayload & { error?: string }
      if (data.error) return
      if (data.status === 'complete' || data.status === 'failed') {
        onReady(data)
      }
    } catch { /* retry */ }
  }, [token, onReady])

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
    </main>
  )
}
