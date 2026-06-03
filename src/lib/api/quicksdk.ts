/**
 * QuickSDK 流水库 API
 */

import { apiGet } from '@/lib/api/client.ts'

const PATH = '/api/quicksdk'

export type QuickSdkRdLineSuggestion = {
  game_name: string
  settlement_month: string | null
  row_count: number
  channel_count: number
  source_game_count: number
  total_flow: number
  top_channel: string | null
  top_channel_flow: number
}

export type QuickSdkRdLineListResponse = {
  items: QuickSdkRdLineSuggestion[]
  total: number
}

export type QuickSdkGameFlowResponse = QuickSdkRdLineSuggestion

function queryString(params: Record<string, unknown>): string {
  const q = new URLSearchParams()
  for (const [key, raw] of Object.entries(params)) {
    if (raw === undefined || raw === null) continue
    const value = String(raw).trim()
    if (value) q.set(key, value)
  }
  const qs = q.toString()
  return qs ? `?${qs}` : ''
}

export function listQuickSdkRdLines(params: {
  settlement_month?: string
  q?: string
  limit?: number
}): Promise<QuickSdkRdLineListResponse> {
  return apiGet<QuickSdkRdLineListResponse>(`${PATH}/rd-lines${queryString(params)}`)
}

export function getQuickSdkGameFlow(params: {
  settlement_month?: string
  game_name: string
}): Promise<QuickSdkGameFlowResponse> {
  return apiGet<QuickSdkGameFlowResponse>(`${PATH}/game-flow${queryString(params)}`)
}
