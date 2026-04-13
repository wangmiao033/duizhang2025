/**
 * 回款登记（快递/寄送）REST API
 * 表字段仅含 delivery_no / company / recipient / customer / send_date / status / remark；
 * 收件电话、地址、partnerId、预计送达等通过 remark 内 JSON（v:1）打包往返。
 */

import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api/client.ts'

export type ApiPaymentRow = {
  id: string
  delivery_no: string | null
  company: string | null
  recipient: string | null
  customer: string | null
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
  customer?: string | null
  send_date?: string | null
  status?: string | null
  remark?: string | null
}

export type PaymentRecordUpdatePayload = Partial<PaymentRecordPayload>

const PATH = '/api/payments'

type UnpackedRemark = {
  text: string
  recipientPhone: string
  address: string
  partnerId: number | null
  expectedDate: string
}

function unpackRemark(remark: string | null | undefined): UnpackedRemark {
  const empty: UnpackedRemark = {
    text: '',
    recipientPhone: '',
    address: '',
    partnerId: null,
    expectedDate: ''
  }
  if (remark == null || remark === '') return empty
  try {
    const o = JSON.parse(remark) as Record<string, unknown>
    if (o && o.v === 1) {
      const pid = o.partnerId
      let partnerId: number | null = null
      if (pid !== undefined && pid !== null && String(pid).trim() !== '') {
        const n = typeof pid === 'number' ? pid : parseInt(String(pid), 10)
        partnerId = Number.isFinite(n) ? n : null
      }
      return {
        text: o.t != null ? String(o.t) : '',
        recipientPhone: o.recipientPhone != null ? String(o.recipientPhone) : '',
        address: o.address != null ? String(o.address) : '',
        partnerId,
        expectedDate: o.expectedDate != null ? String(o.expectedDate) : ''
      }
    }
  } catch {
    /* 纯文本备注 */
  }
  return { ...empty, text: String(remark) }
}

function packRemark(record: Record<string, unknown>): string | null {
  const t = String(record.remark ?? '').trim()
  const recipientPhone = String(record.recipientPhone ?? '').trim()
  const address = String(record.address ?? '').trim()
  const expectedDate = String(record.expectedDate ?? '').trim()
  const pid = record.partnerId
  let partnerId: number | null = null
  if (pid !== undefined && pid !== null && String(pid).trim() !== '') {
    const n = typeof pid === 'number' ? pid : parseInt(String(pid), 10)
    partnerId = Number.isFinite(n) ? n : null
  }
  const hasExt = Boolean(
    recipientPhone || address || expectedDate || (partnerId != null && !Number.isNaN(partnerId))
  )
  if (!t && !hasExt) return null
  if (!hasExt) return t || null
  return JSON.stringify({
    v: 1,
    t,
    recipientPhone,
    address,
    partnerId,
    expectedDate
  })
}

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
  const u = unpackRemark(row.remark)
  return {
    id: row.id != null ? String(row.id) : '',
    trackingNumber: row.delivery_no ?? '',
    courierCompany: row.company ?? '',
    recipient: row.recipient ?? '',
    recipientPhone: u.recipientPhone,
    address: u.address,
    partnerId: u.partnerId,
    partnerName: row.customer ?? '',
    status: row.status || '待寄出',
    sendDate: row.send_date ?? '',
    expectedDate: u.expectedDate,
    remark: u.text,
    createdAt: row.created_at
  }
}

/** 前端 delivery 记录 -> API 写入体 */
export function frontendPaymentToPayload(record: Record<string, unknown>): PaymentRecordPayload {
  return {
    delivery_no: (record.trackingNumber as string)?.trim() || null,
    company: (record.courierCompany as string) || null,
    recipient: (record.recipient as string) || null,
    customer: (record.partnerName as string) || null,
    send_date: (record.sendDate as string) || null,
    status: (record.status as string) || '待寄出',
    remark: packRemark(record)
  }
}

export function getPaymentRecordId(record: Record<string, unknown> | null | undefined): string {
  if (record == null) return ''
  const v = record.id
  if (v === undefined || v === null || v === '') return ''
  return String(v)
}
