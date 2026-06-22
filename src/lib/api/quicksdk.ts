/**
 * QuickSDK 流水库 API
 */

import { ApiError, apiGet } from '@/lib/api/client.ts'

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

export type QuickSdkSummaryResponse = {
  batch_count: number
  row_count: number
  game_count: number
  channel_count: number
  total_flow: number | string
}

export type QuickSdkBatch = {
  id: string
  source_file: string
  settlement_month: string
  row_count: number
  game_count: number
  channel_count: number
  total_flow: number | string
  imported_at?: string | null
}

export type QuickSdkBatchListResponse = {
  items: QuickSdkBatch[]
  total: number
}

export type QuickSdkMonthlySummaryRow = {
  settlement_month: string
  row_count: number
  game_count: number
  channel_count: number
  total_flow: number | string
}

export type QuickSdkRankingRow = {
  name: string
  row_count: number
  total_flow: number | string
  share_rate: number
}

export type QuickSdkAnalyticsResponse = {
  monthly: QuickSdkMonthlySummaryRow[]
  game_rankings: QuickSdkRankingRow[]
  channel_rankings: QuickSdkRankingRow[]
}

type QuickSdkFlowRow = {
  settlement_month?: string | null
  game_name?: string | null
  channel_name?: string | null
  gross_flow?: number | string | null
}

type QuickSdkFlowListResponse = {
  items: QuickSdkFlowRow[]
  total: number
}

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
  return apiGet<QuickSdkRdLineListResponse>(`${PATH}/rd-lines${queryString(params)}`).catch(
    async (error) => {
      if (!(error instanceof ApiError) || error.status !== 404) throw error
      return listQuickSdkRdLinesFromFlows(params)
    }
  )
}

export function getQuickSdkGameFlow(params: {
  settlement_month?: string
  game_name: string
}): Promise<QuickSdkGameFlowResponse> {
  return apiGet<QuickSdkGameFlowResponse>(`${PATH}/game-flow${queryString(params)}`)
}

export function getQuickSdkSummary(params: {
  settlement_month?: string
}): Promise<QuickSdkSummaryResponse> {
  return apiGet<QuickSdkSummaryResponse>(`${PATH}/summary${queryString(params)}`)
}

export function listQuickSdkBatches(params: {
  settlement_month?: string
  limit?: number
  offset?: number
}): Promise<QuickSdkBatchListResponse> {
  return apiGet<QuickSdkBatchListResponse>(`${PATH}/batches${queryString(params)}`)
}

export function getQuickSdkAnalytics(params: {
  settlement_month?: string
}): Promise<QuickSdkAnalyticsResponse> {
  return apiGet<QuickSdkAnalyticsResponse>(`${PATH}/analytics${queryString(params)}`)
}

async function listQuickSdkRdLinesFromFlows(params: {
  settlement_month?: string
  q?: string
  limit?: number
}): Promise<QuickSdkRdLineListResponse> {
  const limit = Math.max(Number(params.limit || 300), 300)
  const response = await apiGet<QuickSdkFlowListResponse>(
    `${PATH}/flows${queryString({ settlement_month: params.settlement_month, limit })}`
  )
  const keyword = String(params.q || '').trim().toLowerCase()
  const groups = new Map<
    string,
    {
      settlement_month: string | null
      row_count: number
      total_flow: number
      source_games: Set<string>
      channels: Map<string, number>
    }
  >()

  for (const row of response.items || []) {
    const sourceGame = String(row.game_name || '').trim()
    if (!sourceGame) continue
    const gameName = normalizeGameName(sourceGame)
    if (keyword && !gameName.toLowerCase().includes(keyword) && !sourceGame.toLowerCase().includes(keyword)) {
      continue
    }
    const channelName = String(row.channel_name || '').trim() || '未填渠道'
    const flow = Number(row.gross_flow || 0)
    const group =
      groups.get(gameName) ||
      {
        settlement_month: row.settlement_month || params.settlement_month || null,
        row_count: 0,
        total_flow: 0,
        source_games: new Set<string>(),
        channels: new Map<string, number>()
      }

    group.row_count += 1
    group.total_flow += Number.isFinite(flow) ? flow : 0
    group.source_games.add(sourceGame)
    group.channels.set(channelName, (group.channels.get(channelName) || 0) + (Number.isFinite(flow) ? flow : 0))
    groups.set(gameName, group)
  }

  const items = Array.from(groups.entries())
    .map(([gameName, group]) => {
      const [topChannel, topChannelFlow] =
        Array.from(group.channels.entries()).sort((a, b) => b[1] - a[1])[0] || [null, 0]
      return {
        game_name: gameName,
        settlement_month: group.settlement_month,
        row_count: group.row_count,
        channel_count: group.channels.size,
        source_game_count: group.source_games.size,
        total_flow: Number(group.total_flow.toFixed(2)),
        top_channel: topChannel,
        top_channel_flow: Number(topChannelFlow.toFixed(2))
      }
    })
    .sort((a, b) => b.total_flow - a.total_flow)

  return {
    items: items.slice(0, params.limit || items.length),
    total: items.length
  }
}

function normalizeGameName(value: string): string {
  return value
    .replace(/005专服\d+.*/u, '')
    .replace(/005折混服.*/u, '')
    .replace(/005$/u, '')
    .trim()
}
