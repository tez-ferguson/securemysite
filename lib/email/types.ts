export type PassiveScanEmailRow = {
  token: string
  url: string
  email: string
  total_count: number
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
  paid?: boolean
  unsubscribe_token?: string
}

export type FollowUpStage = 1 | 2
