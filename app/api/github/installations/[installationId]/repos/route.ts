import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getInstallationOctokit } from '@/lib/github'

export async function GET(
  _req: NextRequest,
  { params }: { params: { installationId: string } },
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const installationId = parseInt(params.installationId, 10)
  if (Number.isNaN(installationId)) {
    return NextResponse.json({ error: 'Invalid installation id' }, { status: 400 })
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
