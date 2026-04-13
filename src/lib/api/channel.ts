/**
 * 渠道对账 REST API
 */

import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api/client.ts'

export type ApiChannelRow = {
  id: string
  channel_name: string | null
  game_name: string | null
  settlement_month: string | null
  start_date: string | null
  end_date: string | null
  billing_flow: number
  voucher_cost: number
  no_worry_cost: number
  refund_cost: number
  test_cost: number
  welfare_cost: number
  share_rate: number
  billing_amount: number
  share_amount: number
  tax_rate: number
  gateway_cost: number
  settlement_amount: number
  status: string | null
  remark: string | null
  server_cost: number | null
  discount_type: string | null
  channel_fee_rate: number | null
  dev_share_rate: number | null
  profit_rate: number | null
  created_at: string
  updated_at: string
}

export type ChannelListResponse = {
  items: ApiChannelRow[]
  total: number
}

export type ChannelRecordPayload = {
  channel_name?: string | null
  game_name?: string | null
  settlement_month?: string | null
  start_date?: string | null
  end_date?: string | null
  billing_flow: number
  voucher_cost: number
  no_worry_cost: number
  refund_cost: number
  test_cost: number
  welfare_cost: number
  share_rate: number
  billing_amount: number
  share_amount: number
  tax_rate: number
  gateway_cost: number
  settlement_amount: number
  status?: string | null
  remark?: string | null
  server_cost?: number | null
  discount_type?: string | null
  channel_fee_rate?: number | null
  dev_share_rate?: number | null
  profit_rate?: number | null
}

export type ChannelRecordUpdatePayload = Partial<ChannelRecordPayload>

const PATH = '/api/channel-records'

export function listChannelRecords(params?: {
  search?: string
  settlement_month?: string
  channel_name?: string
  game_name?: string
  status?: string
  limit?: number
  offset?: number
}): Promise<ChannelListResponse> {
  const q = new URLSearchParams()
  if (params?.search) q.set('search', params.search)
  if (params?.settlement_month) q.set('settlement_month', params.settlement_month)
  if (params?.channel_name) q.set('channel_name', params.channel_name)
  if (params?.game_name) q.set('game_name', params.game_name)
  if (params?.status) q.set('status', params.status)
  if (params?.limit != null) q.set('limit', String(params.limit))
  if (params?.offset != null) q.set('offset', String(params.offset))
  const qs = q.toString()
  return apiGet<ChannelListResponse>(`${PATH}${qs ? `?${qs}` : ''}`)
}

export function getChannelRecord(id: string): Promise<ApiChannelRow> {
  return apiGet<ApiChannelRow>(`${PATH}/${encodeURIComponent(id)}`)
}

export function createChannelRecord(payload: ChannelRecordPayload): Promise<ApiChannelRow> {
  return apiPost<ApiChannelRow>(PATH, payload)
}

export function updateChannelRecord(
  id: string,
  payload: ChannelRecordUpdatePayload
): Promise<ApiChannelRow> {
  return apiPut<ApiChannelRow>(`${PATH}/${encodeURIComponent(id)}`, payload)
}

export function deleteChannelRecord(id: string): Promise<void> {
  return apiDelete(`${PATH}/${encodeURIComponent(id)}`)
}

function numOrNull(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : null
}

/** API 行 -> 前端 ChannelBilling 使用的记录（camelCase，与 channelBillingForm / buildRecordFromForm 一致） */
export function apiChannelRowToFrontend(row: ApiChannelRow): Record<string, unknown> {
  return {
    id: row.id != null ? String(row.id) : '',
    channelName: row.channel_name ?? '',
    gameName: row.game_name ?? '',
    settlementMonth: row.settlement_month ?? '',
    startDate: row.start_date ?? '',
    endDate: row.end_date ?? '',
    flow: row.billing_flow,
    voucherCost: row.voucher_cost,
    noWorryCost: row.no_worry_cost,
    refundCost: row.refund_cost,
    testCost: row.test_cost,
    welfareCost: row.welfare_cost,
    shareRate: row.share_rate,
    billingAmount: row.billing_amount,
    shareAmount: row.share_amount,
    taxRate: row.tax_rate,
    gatewayCost: row.gateway_cost,
    settlementAmount: row.settlement_amount,
    status: row.status || 'pending',
    remark: row.remark != null ? String(row.remark) : '',
    serverCost: row.server_cost,
    discountType: row.discount_type ?? '',
    channelFeeRate: row.channel_fee_rate,
    devShareRate: row.dev_share_rate,
    profitRate: row.profit_rate
  }
}

/** 前端记录（buildRecordFromForm 或列表行）-> API 写入体 */
export function frontendChannelRecordToPayload(record: Record<string, unknown>): ChannelRecordPayload {
  return {
    channel_name: (record.channelName as string) || null,
    game_name: (record.gameName as string) || null,
    settlement_month: (record.settlementMonth as string) || null,
    start_date: (record.startDate as string) || null,
    end_date: (record.endDate as string) || null,
    billing_flow: parseFloat(String(record.flow ?? 0)),
    voucher_cost: parseFloat(String(record.voucherCost ?? 0)),
    no_worry_cost: parseFloat(String(record.noWorryCost ?? 0)),
    refund_cost: parseFloat(String(record.refundCost ?? 0)),
    test_cost: parseFloat(String(record.testCost ?? 0)),
    welfare_cost: parseFloat(String(record.welfareCost ?? 0)),
    share_rate: parseFloat(String(record.shareRate ?? 0)),
    billing_amount: parseFloat(String(record.billingAmount ?? 0)),
    share_amount: parseFloat(String(record.shareAmount ?? 0)),
    tax_rate: parseFloat(String(record.taxRate ?? 0)),
    gateway_cost: parseFloat(String(record.gatewayCost ?? 0)),
    settlement_amount: parseFloat(String(record.settlementAmount ?? 0)),
    status: (record.status as string) || 'pending',
    remark: record.remark != null && String(record.remark).trim() !== '' ? String(record.remark) : null,
    server_cost: numOrNull(record.serverCost),
    discount_type: (record.discountType as string) || null,
    channel_fee_rate: numOrNull(record.channelFeeRate),
    dev_share_rate: numOrNull(record.devShareRate),
    profit_rate: numOrNull(record.profitRate)
  }
}

export function getChannelRecordId(record: Record<string, unknown> | null | undefined): string {
  if (record == null) return ''
  const v = record.id
  if (v === undefined || v === null || v === '') return ''
  return String(v)
}
