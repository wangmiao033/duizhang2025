/**
 * 银行流水统一台账 API
 */

import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api/client.ts'

export type BankTransactionType =
  | 'statement_import'
  | 'payment_register'
  | 'collection_register'

export interface BankTransactionRow {
  id: string
  type: BankTransactionType
  trade_date: string | null
  bank_account: string | null
  payer_name: string | null
  payer_account: string | null
  payer_bank_name: string | null
  payee_name: string | null
  payee_account: string | null
  payee_bank_name: string | null
  amount: string | number | null
  income_amount: string | number | null
  expense_amount: string | number | null
  currency: string | null
  transaction_no: string | null
  instruction_no: string | null
  summary: string | null
  purpose: string | null
  remark: string | null
  status: string | null
  raw_text: string | null
  attachment_url: string | null
  created_at: string
  updated_at: string
}

export type BankTransactionCreateBody = Omit<
  BankTransactionRow,
  'id' | 'created_at' | 'updated_at'
>

export type BankTransactionUpdateBody = Partial<
  Omit<BankTransactionRow, 'id' | 'created_at' | 'updated_at'>
>

export interface BankTransactionListResponse {
  items: BankTransactionRow[]
  total: number
}

const PATH = '/api/bank-transactions'

export interface GetBankTransactionsParams {
  q?: string
  type?: BankTransactionType | ''
  date_from?: string
  date_to?: string
  amount_min?: string
  amount_max?: string
  limit?: number
  offset?: number
}

export async function getBankTransactions(
  params: GetBankTransactionsParams = {}
): Promise<BankTransactionListResponse> {
  const sp = new URLSearchParams()
  if (params.q?.trim()) sp.set('q', params.q.trim())
  if (params.type) sp.set('type', params.type)
  if (params.date_from?.trim()) sp.set('date_from', params.date_from.trim())
  if (params.date_to?.trim()) sp.set('date_to', params.date_to.trim())
  if (params.amount_min?.trim()) sp.set('amount_min', params.amount_min.trim())
  if (params.amount_max?.trim()) sp.set('amount_max', params.amount_max.trim())
  if (params.limit != null) sp.set('limit', String(params.limit))
  if (params.offset != null) sp.set('offset', String(params.offset))
  const qs = sp.toString()
  return apiGet<BankTransactionListResponse>(`${PATH}${qs ? `?${qs}` : ''}`)
}

export async function getBankTransactionDetail(id: string): Promise<BankTransactionRow> {
  return apiGet<BankTransactionRow>(`${PATH}/${encodeURIComponent(id)}`)
}

export async function createBankTransaction(
  body: BankTransactionCreateBody
): Promise<BankTransactionRow> {
  return apiPost<BankTransactionRow>(PATH, body)
}

export async function updateBankTransaction(
  id: string,
  body: BankTransactionUpdateBody
): Promise<BankTransactionRow> {
  return apiPut<BankTransactionRow>(`${PATH}/${encodeURIComponent(id)}`, body)
}

export async function deleteBankTransaction(id: string): Promise<void> {
  return apiDelete(`${PATH}/${encodeURIComponent(id)}`)
}
