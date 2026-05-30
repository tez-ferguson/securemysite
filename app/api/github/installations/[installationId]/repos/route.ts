import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { getInstallationOctokit } from '@/lib/github'

export async function GET(
  _req: NextRequest,
  { params }: { params: { installationId: string } },
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const installationId = parseInt(params.installationId, 10)
  if (Number.isNaN(installationId)) {
    return NextResponse.json({ error: 'Invalid installation id' }, { status: 400 })
  }

  // Verify this installation was registered by the current user
  const supabase = createServiceClient()
  const { data: record } = await supabase
    .from('github_installations')
    .select('installation_id')
    .eq('installation_id', installationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!record) {
    return NextResponse.json({ error: 'Installation not found or access denied' }, { status: 403 })
  }

  try {
    const octokit = await getInstallationOctokit(installationId)
    const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({ per_page: 100 })
    const repos = data.repositories.map((r) => ({ fullName: r.full_name, cloneUrl: r.clone_url }))
    return NextResponse.json({ repos })
  } catch (e) {
    console.error('listReposAccessibleToInstallation:', e)
    return NextResponse.json({ error: 'GitHub API error' }, { status: 502 })
  }
}
