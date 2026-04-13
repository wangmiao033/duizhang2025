/**
 * 异常处理状态（本地持久化，key 为稳定 exception id）
 */

import type { ExceptionUserStatus } from '@/lib/exceptions/exceptionTypes.ts'

const STORAGE_KEY = 'duizhang.exceptionStatuses.v1'

type Row = { status: ExceptionUserStatus; updatedAt: string }

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
        if (st === 'pending' || st === 'ignored' || st === 'resolved') {
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

export function readExceptionStatusMap(): Record<string, Row> {
  return safeRead()
}

export function getExceptionUserStatus(exceptionId: string): ExceptionUserStatus {
  const row = safeRead()[exceptionId]
  return row?.status ?? 'pending'
}

export function setExceptionUserStatus(exceptionId: string, status: ExceptionUserStatus) {
  const all = safeRead()
  all[exceptionId] = { status, updatedAt: new Date().toISOString() }
  writeAll(all)
  try {
    window.dispatchEvent(new CustomEvent('duizhang-exception-status-changed'))
  } catch {
    /* ignore */
  }
}
