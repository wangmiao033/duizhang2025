/**
 * 发票与回款关联 API
 */

import { apiDelete, apiGet, apiPost } from '@/lib/api/client.ts'

export type InvoicePaymentLinkRow = {
  id: string
  invoice_id: string
  payment_id: string
  match_type: string
  match_score: number
  note: string | null
  created_at: string
  updated_at: string
}

export type InvoicePaymentLinkListResponse = {
  items: InvoicePaymentLinkRow[]
  total: number
}

export type InvoicePaymentLinkCreatePayload = {
  invoice_id: string
  payment_id: string
  match_type?: string
  match_score?: number
  note?: string | null
}

export type AutoMatchScores = {
  text: number
  amount: number
  date: number
}

export type AutoMatchCandidate = {
  invoice_id: string
  payment_id: string
  match_score: number
  scores: AutoMatchScores
  invoice_title: string | null
  payment_summary: string | null
}

export type AutoMatchResponse = {
  candidates: AutoMatchCandidate[]
}

const PATH = '/api/invoice-payment-links'

export function listInvoicePaymentLinks(params?: {
  invoice_id?: string
  payment_id?: string
  limit?: number
  offset?: number
}): Promise<InvoicePaymentLinkListResponse> {
  const q = new URLSearchParams()
  if (params?.invoice_id) q.set('invoice_id', params.invoice_id)
  if (params?.payment_id) q.set('payment_id', params.payment_id)
  if (params?.limit != null) q.set('limit', String(params.limit))
  if (params?.offset != null) q.set('offset', String(params.offset))
  const qs = q.toString()
  return apiGet<InvoicePaymentLinkListResponse>(`${PATH}${qs ? `?${qs}` : ''}`)
}

export function createInvoicePaymentLink(
  payload: InvoicePaymentLinkCreatePayload
): Promise<InvoicePaymentLinkRow> {
  return apiPost<InvoicePaymentLinkRow>(PATH, {
    invoice_id: payload.invoice_id,
    payment_id: payload.payment_id,
    match_type: payload.match_type ?? 'manual',
    match_score: payload.match_score ?? 0,
    note: payload.note ?? null
  })
}

export function deleteInvoicePaymentLink(id: string): Promise<void> {
  return apiDelete(`${PATH}/${encodeURIComponent(id)}`)
}

export function autoMatchInvoicePayments(body?: {
  min_score?: number
  limit?: number
}): Promise<AutoMatchResponse> {
  return apiPost<AutoMatchResponse>(`${PATH}/auto-match`, {
    min_score: body?.min_score ?? 0.55,
    limit: body?.limit ?? 200
  })
}
