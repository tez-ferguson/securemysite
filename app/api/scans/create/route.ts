import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { triggerScan } from '@/lib/modal'
import { getInstallationToken } from '@/lib/github'
import { z } from 'zod'

const schema = z.object({
  repoUrl: z.string().url(),
  siteUrl: z.string().url(),
  githubInstallationId: z.string(),
})

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { repoUrl, siteUrl, githubInstallationId } = parsed.data

  const installationId = parseInt(githubInstallationId, 10)
  if (Number.isNaN(installationId)) {
    return NextResponse.json({ error: 'Invalid installation id' }, { status: 400 })
  }

  let githubToken: string
  try {
    githubToken = await getInstallationToken(installationId)
  } catch (e) {
    console.error('GitHub installation token failed:', e)
    return NextResponse.json({ error: 'Could not authenticate GitHub installation' }, { status: 502 })
  }

  const supabase = createServiceClient()
  const repoName = repoUrl.replace('https://github.com/', '').replace('.git', '')

  const { data: job, error } = await supabase
    .from('scan_jobs')
    .insert({ user_id: userId, repo_url: repoUrl, repo_name: repoName, site_url: siteUrl, status: 'queued', github_installation_id: githubInstallationId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 })

  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/scans/${job.id}/callback`

  try {
    await triggerScan({ scanJobId: job.id, repoUrl, githubInstallationId, callbackUrl, callbackSecret: process.env.SCANNER_CALLBACK_SECRET!, githubToken })
    await supabase.from('scan_jobs').update({ status: 'running' }).eq('id', job.id)
  } catch (err) {
    console.error('Modal trigger failed:', err)
  }

  return NextResponse.json({ scanId: job.id })
}
