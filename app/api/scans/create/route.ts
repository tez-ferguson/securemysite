import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
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
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  // Extract repo name from URL
  const repoName = repoUrl.replace('https://github.com/', '').replace('.git', '')

  // Create scan job
  const { data: job, error } = await supabase
    .from('scan_jobs')
    .insert({
      user_id: userId,
      repo_url: repoUrl,
      repo_name: repoName,
      site_url: siteUrl,
      status: 'queued',
      github_installation_id: githubInstallationId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 })

  // Trigger Modal scan asynchronously
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/scans/${job.id}/callback`

  try {
    await triggerScan({
      scanJobId: job.id,
      repoUrl: repoUrl,
      githubInstallationId,
      callbackUrl,
      callbackSecret: process.env.SCANNER_CALLBACK_SECRET!,
      githubToken,
    })

    // Update status to running
    await supabase.from('scan_jobs').update({ status: 'running' }).eq('id', job.id)
  } catch (err) {
    console.error('Modal trigger failed:', err)
    // Job stays 'queued' — could implement retry logic here
  }

  return NextResponse.json({ scanId: job.id })
}
