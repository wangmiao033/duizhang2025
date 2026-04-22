/**
 * 前端统一 HTTP 客户端（研发对账等模块复用）
 */

/// <reference types="vite/client" />

const rawBase =
  (import.meta.env.VITE_API_BASE_URL || '').trim() || 'https://caiwuapi.hnchpower.cn'

export const API_BASE_URL = rawBase.replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

function joinUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${p}`
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(joinUrl(path), { method: 'GET', credentials: 'include' })
  return parseResponse<T>(res)
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(joinUrl(path), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return parseResponse<T>(res)
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(joinUrl(path), {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return parseResponse<T>(res)
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(joinUrl(path), { method: 'DELETE', credentials: 'include' })
  if (res.status === 204) return
  await parseResponse<unknown>(res)
}

/** multipart/form-data（不设置 Content-Type，由浏览器带 boundary） */
export async function apiPostMultipart<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(joinUrl(path), {
    method: 'POST',
    credentials: 'include',
    body: formData
  })
  return parseResponse<T>(res)
}

export async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text) as unknown
    } catch {
      data = text
    }
  }
  if (!res.ok) {
    const detail =
      data && typeof data === 'object' && data !== null && 'detail' in data
        ? (() => {
            const rawDetail = (data as { detail: unknown }).detail
            if (typeof rawDetail === 'string') return rawDetail
            try {
              return JSON.stringify(rawDetail)
            } catch {
              return String(rawDetail)
            }
          })()
        : typeof data === 'string'
          ? data
          : res.statusText
    throw new ApiError(detail || res.statusText, res.status, data)
  }
  return data as T
}
