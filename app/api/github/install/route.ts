import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'

const schema = z.object({
  scanId: z.string().uuid(),
  installationId: z.string(),
  repoUrl: z.string().url().optional(),
  repoName: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { scanId, installationId, repoUrl, repoName } = parsed.data
  const supabase = createServiceClient()

  const update: Record<string, string> = { github_installation_id: installationId }
  if (repoUrl) update.repo_url = repoUrl
  if (repoName) update.repo_name = repoName

  const { data, error } = await supabase
    .from('scan_jobs')
    .update(update)
    .eq('id', scanId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('Supabase update error:', error)
    return NextResponse.json({ error: 'Failed to update scan job' }, { status: 500 })
  }

  if (!data) return NextResponse.json({ error: 'Scan not found or access denied' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
