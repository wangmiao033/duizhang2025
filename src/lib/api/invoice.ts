/**
 * 发票管理 REST API
 */

import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api/client.ts'

export type ApiInvoiceRow = {
  id: string
  title: string | null
  tax_no: string | null
  invoice_amount: number
  invoice_date: string | null
  status: string | null
  remark: string | null
  verified: boolean
  verified_amount: number
  verified_record_ids: string[]
  created_at: string
  updated_at: string
}

export type InvoiceListResponse = {
  items: ApiInvoiceRow[]
  total: number
}

export type InvoiceRecordPayload = {
  title?: string | null
  tax_no?: string | null
  invoice_amount: number
  invoice_date?: string | null
  status?: string | null
  remark?: string | null
  verified: boolean
  verified_amount: number
  verified_record_ids: string[]
}

export type InvoiceRecordUpdatePayload = Partial<InvoiceRecordPayload>

const PATH = '/api/invoices'

export function listInvoiceRecords(params?: {
  search?: string
  status?: string
  limit?: number
  offset?: number
}): Promise<InvoiceListResponse> {
  const q = new URLSearchParams()
  if (params?.search) q.set('search', params.search)
  if (params?.status) q.set('status', params.status)
  if (params?.limit != null) q.set('limit', String(params.limit))
  if (params?.offset != null) q.set('offset', String(params.offset))
  const qs = q.toString()
  return apiGet<InvoiceListResponse>(`${PATH}${qs ? `?${qs}` : ''}`)
}

export function getInvoiceRecord(id: string): Promise<ApiInvoiceRow> {
  return apiGet<ApiInvoiceRow>(`${PATH}/${encodeURIComponent(id)}`)
}

export function createInvoiceRecord(payload: InvoiceRecordPayload): Promise<ApiInvoiceRow> {
  return apiPost<ApiInvoiceRow>(PATH, payload)
}

export function updateInvoiceRecord(
  id: string,
  payload: InvoiceRecordUpdatePayload
): Promise<ApiInvoiceRow> {
  return apiPut<ApiInvoiceRow>(`${PATH}/${encodeURIComponent(id)}`, payload)
}

export function deleteInvoiceRecord(id: string): Promise<void> {
  return apiDelete(`${PATH}/${encodeURIComponent(id)}`)
}

/** API 行 -> 前端发票记录（与 useInvoiceStore / InvoiceForm 字段一致） */
export function apiInvoiceRowToFrontend(row: ApiInvoiceRow): Record<string, unknown> {
  const amt = row.invoice_amount
  return {
    id: row.id != null ? String(row.id) : '',
    title: row.title ?? '',
    taxNo: row.tax_no ?? '',
    amount: Number.isFinite(amt) ? amt.toFixed(2) : '0.00',
    issueDate: row.invoice_date ?? '',
    status: row.status || '未开',
    remark: row.remark != null ? String(row.remark) : '',
    verified: Boolean(row.verified),
    verifiedAmount: Number.isFinite(row.verified_amount) ? row.verified_amount : 0,
    verifiedRecordIds: Array.isArray(row.verified_record_ids)
      ? row.verified_record_ids.map((x) => String(x))
      : []
  }
}

/** 前端记录 -> API 写入体 */
export function frontendInvoiceRecordToPayload(record: Record<string, unknown>): InvoiceRecordPayload {
  const idsRaw = record.verifiedRecordIds
  const ids = Array.isArray(idsRaw) ? idsRaw.map((x) => String(x)) : []
  const va = record.verifiedAmount ?? record.verified_amount
  const verifiedAmt =
    typeof va === 'number' && Number.isFinite(va) ? va : parseFloat(String(va ?? 0)) || 0
  return {
    title: (record.title as string) || null,
    tax_no: (record.taxNo as string) || null,
    invoice_amount: parseFloat(String(record.amount ?? 0)),
    invoice_date: (record.issueDate as string) || null,
    status: (record.status as string) || '未开',
    remark:
      record.remark != null && String(record.remark).trim() !== '' ? String(record.remark) : null,
    verified: Boolean(record.verified),
    verified_amount: verifiedAmt,
    verified_record_ids: ids
  }
}

export function getInvoiceRecordId(record: Record<string, unknown> | null | undefined): string {
  if (record == null) return ''
  const v = record.id
  if (v === undefined || v === null || v === '') return ''
  return String(v)
}
