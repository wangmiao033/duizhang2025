import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api/client.ts'

export type ApiContractRow = {
  id: string
  signing_date: string | null
  channel: string | null
  platform: string | null
  address: string | null
  valid_period: string | null
  game: string | null
  channel_share: string | null
  issue_share: string | null
  channel_fee: string | null
  remark: string | null
  created_at: string
  updated_at: string
}

export type ContractListResponse = {
  items: ApiContractRow[]
  total: number
}

export type ContractPayload = {
  signing_date?: string | null
  channel?: string | null
  platform?: string | null
  address?: string | null
  valid_period?: string | null
  game?: string | null
  channel_share?: string | null
  issue_share?: string | null
  channel_fee?: string | null
  remark?: string | null
}

const PATH = '/api/contracts'

export function listContracts(params?: { search?: string; limit?: number; offset?: number }) {
  const q = new URLSearchParams()
  if (params?.search) q.set('search', params.search)
  if (params?.limit != null) q.set('limit', String(params.limit))
  if (params?.offset != null) q.set('offset', String(params.offset))
  const qs = q.toString()
  return apiGet<ContractListResponse>(`${PATH}${qs ? `?${qs}` : ''}`)
}

export function createContract(payload: ContractPayload) {
  return apiPost<ApiContractRow>(PATH, payload)
}

export function updateContract(id: string, payload: Partial<ContractPayload>) {
  return apiPut<ApiContractRow>(`${PATH}/${encodeURIComponent(id)}`, payload)
}

export function deleteContract(id: string) {
  return apiDelete(`${PATH}/${encodeURIComponent(id)}`)
}
