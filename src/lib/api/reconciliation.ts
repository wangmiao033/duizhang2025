/**
 * 研发对账 REST API
 */

import {
  apiDelete,
  apiGet,
  apiPost,
  apiPostMultipart,
  apiPut,
  ApiError
} from '@/lib/api/client.ts'
import type { BankTransactionRow } from '@/lib/api/bankTransaction.ts'

export type ApiReconciliationLineItemRow = {
  id: string
  reconciliation_id: string
  game_name: string | null
  revenue: number
  discount_rate: number
  net_revenue: number
  coupon_amount: number
  test_fee: number
  extra_fee: number
  share_ratio: number
  tax_rate: number
  share_amount: number
  settlement_amount: number
  sort_order: number
  created_at: string
}

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
  /** GET单条时返回；列表接口为空数组 */
  items?: ApiReconciliationLineItemRow[]
  /** 列表用：未登记 / 待打款 / 已提交 / 已付款 / 金额异常 / 打款失败 */
  bank_payment_list_status?: string | null
  /** 银行付款登记（bank_transactions）关联聚合，由后端计算 */
  paid_amount?: number
  unpaid_amount?: number
  payment_status?: string
  payment_count?: number
  latest_payment_date?: string | null
}

export type BankPaymentTransferStatus = 'pending_submit' | 'submitted' | 'paid' | 'failed'

export type ApiBankPaymentRow = {
  id: string
  reconciliation_id: string
  transaction_serial: string | null
  authorization_status: string | null
  remittance_amount: number
  remittance_purpose: string | null
  payment_remark: string | null
  is_scheduled: boolean
  payment_date: string | null
  transfer_status: string
  remitter_company: string | null
  remitter_account: string | null
  remitter_bank_name: string | null
  payee_company: string | null
  payee_account: string | null
  payee_bank_name: string | null
  submitter_user_id: string | null
  first_approver_user_id: string | null
  first_approval_at: string | null
  bank_feedback: string | null
  instruction_channel: string | null
  is_personal_payee: boolean
  created_at: string
  updated_at: string
}

export type ApiBankPaymentAttachmentRow = {
  id: string
  bank_payment_id: string
  file_name: string
  /** 相对 API 根的下载路径，如 /api/reconciliation/.../file */
  file_url: string
  file_type: string | null
  created_at: string
}

export type BankPaymentUpsertPayload = {
  transaction_serial?: string | null
  authorization_status?: string | null
  remittance_amount: number
  remittance_purpose?: string | null
  payment_remark?: string | null
  is_scheduled: boolean
  payment_date?: string | null
  transfer_status: string
  remitter_company?: string | null
  remitter_account?: string | null
  remitter_bank_name?: string | null
  payee_company?: string | null
  payee_account?: string | null
  payee_bank_name?: string | null
  submitter_user_id?: string | null
  first_approver_user_id?: string | null
  first_approval_at?: string | null
  bank_feedback?: string | null
  instruction_channel?: string | null
  is_personal_payee: boolean
}

export type ReconciliationListResponse = {
  items: ApiReconciliationRow[]
  total: number
}

export type ReconciliationLineItemPayload = {
  game_name: string | null
  revenue: number
  discount_rate: number
  coupon_amount: number
  test_fee: number
  extra_fee: number
  share_ratio: number
  tax_rate: number
  sort_order: number
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
  items?: ReconciliationLineItemPayload[]
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

export function listReconciliationLinkedBankPayments(
  reconciliationId: string
): Promise<{ items: BankTransactionRow[]; total: number }> {
  return apiGet<{ items: BankTransactionRow[]; total: number }>(
    `${PATH}/${encodeURIComponent(reconciliationId)}/payments`
  )
}

export async function getReconciliationBankPayment(
  reconciliationId: string
): Promise<ApiBankPaymentRow | null> {
  try {
    return await apiGet<ApiBankPaymentRow | null>(
      `${PATH}/${encodeURIComponent(reconciliationId)}/bank-payment`
    )
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null
    throw e
  }
}

export function upsertReconciliationBankPayment(
  reconciliationId: string,
  payload: BankPaymentUpsertPayload
): Promise<ApiBankPaymentRow> {
  return apiPut<ApiBankPaymentRow>(
    `${PATH}/${encodeURIComponent(reconciliationId)}/bank-payment`,
    payload
  )
}

export function listBankPaymentAttachments(
  reconciliationId: string
): Promise<{ items: ApiBankPaymentAttachmentRow[] }> {
  return apiGet<{ items: ApiBankPaymentAttachmentRow[] }>(
    `${PATH}/${encodeURIComponent(reconciliationId)}/bank-payment/attachments`
  )
}

export function uploadBankPaymentAttachment(
  reconciliationId: string,
  file: File
): Promise<ApiBankPaymentAttachmentRow> {
  const fd = new FormData()
  fd.append('file', file)
  return apiPostMultipart<ApiBankPaymentAttachmentRow>(
    `${PATH}/${encodeURIComponent(reconciliationId)}/bank-payment/attachments`,
    fd
  )
}

export function deleteBankPaymentAttachment(
  reconciliationId: string,
  attachmentId: string
): Promise<void> {
  return apiDelete(
    `${PATH}/${encodeURIComponent(reconciliationId)}/bank-payment/attachments/${encodeURIComponent(attachmentId)}`
  )
}

/** 列表/表格行主键：统一为字符串，与后端 UUID 及路由 state 一致 */
export function getReconciliationRecordId(
  record: Record<string, unknown> | null | undefined
): string {
  if (record == null) return ''
  const v = record.id
  if (v === undefined || v === null || v === '') return ''
  return String(v)
}

function apiLineToFrontend(line: ApiReconciliationLineItemRow) {
  return {
    id: line.id,
    gameName: line.game_name != null ? String(line.game_name) : '',
    revenue: String(line.revenue ?? 0),
    discountRate: String(line.discount_rate ?? 1),
    couponAmount: String(line.coupon_amount ?? 0),
    testFee: String(line.test_fee ?? 0),
    extraFee: String(line.extra_fee ?? 0),
    shareRatio: String(line.share_ratio ?? 0),
    taxRate: String(line.tax_rate ?? 0),
    sortOrder: line.sort_order ?? 0
  }
}

function legacyItemsFromApiRow(row: ApiReconciliationRow) {
  return [
    {
      id: `legacy-${row.id}`,
      gameName: row.game_name != null ? String(row.game_name) : '',
      revenue: String(row.game_flow ?? 0),
      discountRate: String(row.discount_value ?? 1),
      couponAmount: String(row.voucher_cost ?? 0),
      testFee: String(row.test_cost ?? 0),
      extraFee: String(row.refund_amount ?? 0),
      shareRatio: String(row.revenue_share_rate ?? 0),
      taxRate: String(row.tax_rate ?? 0),
      sortOrder: 0
    }
  ]
}

/** 后端行 -> 前端列表/表单使用的记录结构（字段名与 DataForm / store 一致） */
export function apiRowToFrontend(row: ApiReconciliationRow): Record<string, unknown> {
  const idStr = row.id != null && String(row.id).trim() !== '' ? String(row.id) : ''
  const rawItems = row.items
  const items =
    Array.isArray(rawItems) && rawItems.length > 0
      ? rawItems.map(apiLineToFrontend)
      : legacyItemsFromApiRow(row)
  return {
    id: idStr,
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
    memo: row.remark != null ? String(row.remark) : '',
    items,
    paidAmount:
      row.paid_amount != null && Number.isFinite(Number(row.paid_amount))
        ? Number(row.paid_amount).toFixed(2)
        : '0.00',
    unpaidAmount:
      row.unpaid_amount != null && Number.isFinite(Number(row.unpaid_amount))
        ? Number(row.unpaid_amount).toFixed(2)
        : '0.00',
    paymentStatus: row.payment_status != null ? String(row.payment_status) : '未付款',
    paymentCount:
      row.payment_count != null && Number.isFinite(Number(row.payment_count))
        ? Number(row.payment_count)
        : 0,
    latestPaymentDate: row.latest_payment_date != null ? String(row.latest_payment_date) : ''
  }
}

/** 前端记录 -> API 写入体 */
export function frontendRecordToApiPayload(
  record: Record<string, unknown>,
  options?: { includeStatementNo?: boolean }
): ReconciliationCreatePayload {
  const includeNo = options?.includeStatementNo !== false
  const settlementNumber = (record.settlementNumber as string) || ''
  const recItems = record.items as Array<Record<string, unknown>> | undefined
  const items: ReconciliationLineItemPayload[] | undefined =
    Array.isArray(recItems) && recItems.length > 0
      ? recItems.map((line, idx) => ({
          game_name:
            line.gameName != null && String(line.gameName).trim() !== ''
              ? String(line.gameName).trim()
              : null,
          revenue: parseFloat(String(line.revenue ?? 0)),
          discount_rate: parseFloat(String(line.discountRate ?? 1)),
          coupon_amount: parseFloat(String(line.couponAmount ?? 0)),
          test_fee: parseFloat(String(line.testFee ?? 0)),
          extra_fee: parseFloat(String(line.extraFee ?? 0)),
          share_ratio: parseFloat(String(line.shareRatio ?? 0)),
          tax_rate: parseFloat(String(line.taxRate ?? 0)),
          sort_order: Number(line.sortOrder ?? idx)
        }))
      : undefined
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
    remark: record.memo != null && record.memo !== '' ? String(record.memo) : null,
    ...(items !== undefined ? { items } : {})
  }
}
