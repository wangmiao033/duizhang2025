/**
 * 异常处理状态 API（与 makeExceptionId 对应）
 */

import { apiGet, apiPost } from '@/lib/api/client.ts'

export type ExceptionStatusRow = {
  id: string
  exception_id: string
  status: string
  updated_at: string
}

export type ExceptionStatusListResponse = {
  items: ExceptionStatusRow[]
  total: number
}

export type ExceptionStatusUpsertPayload = {
  exception_id: string
  status: 'pending' | 'ignored' | 'resolved'
}

export function listExceptionStatuses(params?: {
  exception_id?: string
  limit?: number
  offset?: number
}): Promise<ExceptionStatusListResponse> {
  const q = new URLSearchParams()
  if (params?.exception_id) q.set('exception_id', params.exception_id)
  if (params?.limit != null) q.set('limit', String(params.limit))
  if (params?.offset != null) q.set('offset', String(params.offset))
  const qs = q.toString()
  return apiGet<ExceptionStatusListResponse>(`/api/exception-statuses${qs ? `?${qs}` : ''}`)
}

export function upsertExceptionStatus(
  payload: ExceptionStatusUpsertPayload
): Promise<ExceptionStatusRow> {
  return apiPost<ExceptionStatusRow>('/api/exception-statuses', {
    exception_id: payload.exception_id,
    status: payload.status
  })
}
