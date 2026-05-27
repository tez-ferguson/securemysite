export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low'

export interface Finding {
  id: string
  type: string
  severity: SeverityLevel
  file: string
  line: number
  description: string
  snippet: string
  fix_prompt: string
  raw_type?: string
}

export interface ScanJob {
  id: string
  repo_url: string
  repo_name: string | null
  site_url: string | null
  status: 'queued' | 'running' | 'complete' | 'failed'
  github_installation_id?: string | null
  fix_status?: string | null
  created_at: string
  completed_at: string | null
}

export interface ScanResult {
  status: string
  totalCount: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  unlocked: boolean
  findings?: Finding[]
}
