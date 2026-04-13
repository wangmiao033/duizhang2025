/**
 * 异常处理状态：优先后端 API，失败时回退 localStorage（key仍为 duizhang.exceptionStatuses.v1）
 */

import type { ExceptionUserStatus } from '@/lib/exceptions/exceptionTypes.ts'
import {
  listExceptionStatuses,
  upsertExceptionStatus,
  type ExceptionStatusRow
} from '@/lib/api/exceptionStatus.ts'

const STORAGE_KEY = 'duizhang.exceptionStatuses.v1'

type Row = { status: ExceptionUserStatus; updatedAt: string }

function isValidStatus(s: string): s is ExceptionUserStatus {
  return s === 'pending' || s === 'ignored' || s === 'resolved'
}

function safeRead(): Record<string, Row> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const o = JSON.parse(raw) as Record<string, unknown>
    if (!o || typeof o !== 'object') return {}
    const out: Record<string, Row> = {}
    for (const [k, v] of Object.entries(o)) {
      if (v && typeof v === 'object' && 'status' in v) {
        const st = (v as Row).status
        if (isValidStatus(st)) {
          out[k] = {
            status: st,
            updatedAt: typeof (v as Row).updatedAt === 'string' ? (v as Row).updatedAt : ''
          }
        }
      }
    }
    return out
  } catch {
    return {}
  }
}

function writeAll(data: Record<string, Row>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/** 供构建异常列表：仅读本地缓存（服务端合并由 Hook 注入 statusMap） */
export function readLocalStatusMap(): Record<string, ExceptionUserStatus> {
  const raw = safeRead()
  const out: Record<string, ExceptionUserStatus> = {}
  for (const [k, v] of Object.entries(raw)) {
    out[k] = v.status
  }
  return out
}

export function readExceptionStatusMap(): Record<string, Row> {
  return safeRead()
}

function writeLocalRow(exceptionId: string, status: ExceptionUserStatus, updatedAt: string) {
  const all = safeRead()
  all[exceptionId] = { status, updatedAt }
  writeAll(all)
}

/** 将服务端列表合并进本地缓存（服务端优先覆盖同 exception_id） */
export function mergeServerRowsIntoLocal(rows: ExceptionStatusRow[]) {
  const all = safeRead()
  for (const r of rows) {
    if (!r.exception_id || !isValidStatus(r.status)) continue
    const at =
      r.updated_at && typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString()
    all[r.exception_id] = { status: r.status, updatedAt: at }
  }
  writeAll(all)
}

export function rowsToStatusMap(rows: ExceptionStatusRow[]): Record<string, ExceptionUserStatus> {
  const m: Record<string, ExceptionUserStatus> = {}
  for (const r of rows) {
    if (r.exception_id && isValidStatus(r.status)) {
      m[r.exception_id] = r.status
    }
  }
  return m
}

export function dispatchExceptionStatusChanged(exceptionId: string, status: ExceptionUserStatus) {
  try {
    window.dispatchEvent(
      new CustomEvent('duizhang-exception-status-changed', { detail: { exceptionId, status } })
    )
  } catch {
    /* ignore */
  }
}

/**
 * 从服务端拉取全量状态；失败返回 null（调用方继续用本地）
 */
export async function fetchExceptionStatusesFromApi(): Promise<Record<
  string,
  ExceptionUserStatus
> | null> {
  try {
    const res = await listExceptionStatuses({ limit: 10000, offset: 0 })
    mergeServerRowsIntoLocal(res.items)
    return rowsToStatusMap(res.items)
  } catch {
    return null
  }
}

/**
 * 优先写后端，失败则仅写本地并仍派发事件
 */
export async function setExceptionUserStatus(
  exceptionId: string,
  status: ExceptionUserStatus
): Promise<{ usedFallback: boolean }> {
  const now = new Date().toISOString()
  try {
    const row = await upsertExceptionStatus({ exception_id: exceptionId, status })
    const at =
      row.updated_at && typeof row.updated_at === 'string' ? row.updated_at : now
    writeLocalRow(exceptionId, status, at)
    dispatchExceptionStatusChanged(exceptionId, status)
    return { usedFallback: false }
  } catch {
    writeLocalRow(exceptionId, status, now)
    dispatchExceptionStatusChanged(exceptionId, status)
    return { usedFallback: true }
  }
}
