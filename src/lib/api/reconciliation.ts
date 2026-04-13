/**
 * 研发对账 REST API
 */

import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api/client.ts'

export type ApiReconciliationRow = {
  id: string
  statement_no: string
  settlement_month: string | null
  partner_name: string | null
  game_name: string | null
  game_flow: number
  test_cost: number
  voucher_cost: number
  channel_fee_rate: number
  tax_rate: number
  revenue_share_rate: number
  discount_value: number
  refund_amount: number
  settlement_amount: number
  status: string | null
  remark: string | null
  created_at: string
  updated_at: string
}

export type ReconciliationListResponse = {
  items: ApiReconciliationRow[]
  total: number
}

export type ReconciliationCreatePayload = {
  statement_no?: string | null
  settlement_month?: string | null
  partner_name?: string | null
  game_name?: string | null
  game_flow: number
  test_cost: number
  voucher_cost: number
  channel_fee_rate: number
  tax_rate: number
  revenue_share_rate: number
  discount_value: number
  refund_amount: number
  settlement_amount: number
  status?: string | null
  remark?: string | null
}

export type ReconciliationUpdatePayload = Partial<ReconciliationCreatePayload>

const PATH = '/api/reconciliation'

export function listReconciliationRecords(params?: {
  search?: string
  settlement_month?: string
  partner_name?: string
  game_name?: string
  status?: string
  limit?: number
  offset?: number
}): Promise<ReconciliationListResponse> {
  const q = new URLSearchParams()
  if (params?.search) q.set('search', params.search)
  if (params?.settlement_month) q.set('settlement_month', params.settlement_month)
  if (params?.partner_name) q.set('partner_name', params.partner_name)
  if (params?.game_name) q.set('game_name', params.game_name)
  if (params?.status) q.set('status', params.status)
  if (params?.limit != null) q.set('limit', String(params.limit))
  if (params?.offset != null) q.set('offset', String(params.offset))
  const qs = q.toString()
  return apiGet<ReconciliationListResponse>(`${PATH}${qs ? `?${qs}` : ''}`)
}

export function getReconciliationRecord(id: string): Promise<ApiReconciliationRow> {
  return apiGet<ApiReconciliationRow>(`${PATH}/${encodeURIComponent(id)}`)
}

export function createReconciliationRecord(
  payload: ReconciliationCreatePayload
): Promise<ApiReconciliationRow> {
  return apiPost<ApiReconciliationRow>(PATH, payload)
}

export function updateReconciliationRecord(
  id: string,
  payload: ReconciliationUpdatePayload
): Promise<ApiReconciliationRow> {
  return apiPut<ApiReconciliationRow>(`${PATH}/${encodeURIComponent(id)}`, payload)
}

export function deleteReconciliationRecord(id: string): Promise<void> {
  return apiDelete(`${PATH}/${encodeURIComponent(id)}`)
}

/** 后端行 -> 前端列表/表单使用的记录结构（字段名与 DataForm / store 一致） */
export function apiRowToFrontend(row: ApiReconciliationRow): Record<string, unknown> {
  return {
    id: row.id,
    settlementMonth: row.settlement_month ?? '',
    settlementNumber: row.statement_no ?? '',
    partner: row.partner_name ?? '',
    game: row.game_name ?? '',
    gameFlow: row.game_flow != null ? String(row.game_flow) : '0',
    testingFee: row.test_cost != null ? String(row.test_cost) : '0',
    voucher: row.voucher_cost != null ? String(row.voucher_cost) : '0',
    channelFeeRate: row.channel_fee_rate != null ? String(row.channel_fee_rate) : '0',
    taxPoint: row.tax_rate != null ? String(row.tax_rate) : '0',
    revenueShareRatio: row.revenue_share_rate != null ? String(row.revenue_share_rate) : '15',
    discount: row.discount_value != null ? String(row.discount_value) : '1',
    refund: row.refund_amount != null ? String(row.refund_amount) : '0',
    settlementAmount:
      row.settlement_amount != null ? Number(row.settlement_amount).toFixed(2) : '0.00',
    status: row.status || 'pending',
    memo: row.remark != null ? String(row.remark) : ''
  }
}

/** 前端记录 -> API 写入体 */
export function frontendRecordToApiPayload(
  record: Record<string, unknown>,
  options?: { includeStatementNo?: boolean }
): ReconciliationCreatePayload {
  const includeNo = options?.includeStatementNo !== false
  const settlementNumber = (record.settlementNumber as string) || ''
  return {
    ...(includeNo ? { statement_no: settlementNumber || null } : {}),
    settlement_month: (record.settlementMonth as string) || null,
    partner_name: (record.partner as string) || null,
    game_name: (record.game as string) || null,
    game_flow: parseFloat(String(record.gameFlow ?? 0)),
    test_cost: parseFloat(String(record.testingFee ?? 0)),
    voucher_cost: parseFloat(String(record.voucher ?? 0)),
    channel_fee_rate: parseFloat(String(record.channelFeeRate ?? 0)),
    tax_rate: parseFloat(String(record.taxPoint ?? 0)),
    revenue_share_rate: parseFloat(String(record.revenueShareRatio ?? 0)),
    discount_value: parseFloat(String(record.discount ?? 1)),
    refund_amount: parseFloat(String(record.refund ?? 0)),
    settlement_amount: parseFloat(String(record.settlementAmount ?? 0)),
    status: (record.status as string) || 'pending',
    remark: record.memo != null && record.memo !== '' ? String(record.memo) : null
  }
}
