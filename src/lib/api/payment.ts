/**
 * 回款登记（快递/寄送）REST API
 */

import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api/client.ts'

export type ApiPaymentRow = {
  id: string
  delivery_no: string | null
  company: string | null
  recipient: string | null
  recipient_phone: string | null
  address: string | null
  partner_id: string | null
  customer: string | null
  expected_date: string | null
  send_date: string | null
  status: string | null
  remark: string | null
  created_at: string
  updated_at: string
}

export type PaymentListResponse = {
  items: ApiPaymentRow[]
  total: number
}

export type PaymentRecordPayload = {
  delivery_no?: string | null
  company?: string | null
  recipient?: string | null
  recipient_phone?: string | null
  address?: string | null
  partner_id?: string | null
  customer?: string | null
  expected_date?: string | null
  send_date?: string | null
  status?: string | null
  remark?: string | null
}

export type PaymentRecordUpdatePayload = Partial<PaymentRecordPayload>

const PATH = '/api/payments'

export function listPayments(params?: {
  search?: string
  status?: string
  limit?: number
  offset?: number
}): Promise<PaymentListResponse> {
  const q = new URLSearchParams()
  if (params?.search) q.set('search', params.search)
  if (params?.status) q.set('status', params.status)
  if (params?.limit != null) q.set('limit', String(params.limit))
  if (params?.offset != null) q.set('offset', String(params.offset))
  const qs = q.toString()
  return apiGet<PaymentListResponse>(`${PATH}${qs ? `?${qs}` : ''}`)
}

export function getPayment(id: string): Promise<ApiPaymentRow> {
  return apiGet<ApiPaymentRow>(`${PATH}/${encodeURIComponent(id)}`)
}

export function createPayment(payload: PaymentRecordPayload): Promise<ApiPaymentRow> {
  return apiPost<ApiPaymentRow>(PATH, payload)
}

export function updatePayment(id: string, payload: PaymentRecordUpdatePayload): Promise<ApiPaymentRow> {
  return apiPut<ApiPaymentRow>(`${PATH}/${encodeURIComponent(id)}`, payload)
}

export function deletePayment(id: string): Promise<void> {
  return apiDelete(`${PATH}/${encodeURIComponent(id)}`)
}

/** API 行 -> 前端 deliveries 项（与 deliveryForm.js / Payment* 一致） */
export function apiPaymentRowToFrontend(row: ApiPaymentRow): Record<string, unknown> {
  let partnerId: number | null = null
  if (row.partner_id != null && String(row.partner_id).trim() !== '') {
    const n = parseInt(String(row.partner_id), 10)
    partnerId = Number.isFinite(n) ? n : null
  }
  return {
    id: row.id != null ? String(row.id) : '',
    trackingNumber: row.delivery_no ?? '',
    courierCompany: row.company ?? '',
    recipient: row.recipient ?? '',
    recipientPhone: row.recipient_phone ?? '',
    address: row.address ?? '',
    partnerId,
    partnerName: row.customer ?? '',
    status: row.status || '待寄出',
    sendDate: row.send_date ?? '',
    expectedDate: row.expected_date ?? '',
    remark: row.remark != null ? String(row.remark) : '',
    createdAt: row.created_at
  }
}

/** 前端 delivery 记录 -> API 写入体 */
export function frontendPaymentToPayload(record: Record<string, unknown>): PaymentRecordPayload {
  const pid = record.partnerId
  const partnerIdStr =
    pid !== undefined && pid !== null && String(pid).trim() !== '' ? String(pid) : null
  return {
    delivery_no: (record.trackingNumber as string)?.trim() || null,
    company: (record.courierCompany as string) || null,
    recipient: (record.recipient as string) || null,
    recipient_phone: (record.recipientPhone as string) || null,
    address: (record.address as string) || null,
    partner_id: partnerIdStr,
    customer: (record.partnerName as string) || null,
    expected_date: (record.expectedDate as string) || null,
    send_date: (record.sendDate as string) || null,
    status: (record.status as string) || '待寄出',
    remark:
      record.remark != null && String(record.remark).trim() !== '' ? String(record.remark) : null
  }
}

export function getPaymentRecordId(record: Record<string, unknown> | null | undefined): string {
  if (record == null) return ''
  const v = record.id
  if (v === undefined || v === null || v === '') return ''
  return String(v)
}
