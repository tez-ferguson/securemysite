import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { z } from 'zod'

const schema = z.object({
  installationId: z.number().int().positive(),
})

/**
 * POST /api/github/installations/register
 *
 * Called immediately after the GitHub App installation callback so that
 * the installation ID is bound to the authenticated user. Subsequent
 * requests to list repos or create scans verify this mapping.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { installationId } = parsed.data
  const supabase = createServiceClient()

  // Upsert so re-installations by the same user are idempotent.
  // If a different user tries to claim an existing installation, do nothing
  // (the existing owner keeps it; the conflict is silently swallowed).
  const { error } = await supabase
    .from('github_installations')
    .upsert({ installation_id: installationId, user_id: userId }, { onConflict: 'installation_id', ignoreDuplicates: true })

  if (error) {
    console.error('Failed to register installation:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
