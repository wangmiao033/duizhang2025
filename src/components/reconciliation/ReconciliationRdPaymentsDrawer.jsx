import React, { useEffect, useState } from 'react'
import { ApiError } from '@/lib/api/client.ts'
import { listReconciliationLinkedBankPayments } from '@/lib/api/reconciliation.ts'

function formatAmt(v) {
  if (v == null || v === '') return '—'
  const n = Number(v)
  return Number.isFinite(n) ? `¥${n.toFixed(2)}` : String(v)
}

function formatDate(s) {
  if (s == null || s === '') return '—'
  const t = String(s).slice(0, 10)
  return t || '—'
}

/**
 * 展示某条研发对账已关联的银行付款登记（bank_transactions）
 */
function ReconciliationRdPaymentsDrawer({ open, reconciliationId, statementNo, onClose }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [items, setItems] = useState([])

  useEffect(() => {
    if (!open || !reconciliationId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    setItems([])
    ;(async () => {
      try {
        const res = await listReconciliationLinkedBankPayments(String(reconciliationId))
        if (!cancelled) setItems(res.items || [])
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : '加载失败')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, reconciliationId])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return (
    <>
      <button type="button" className="rec-drawer-backdrop" aria-label="关闭" onClick={onClose} />
      <aside
        className="rec-drawer rec-drawer--light rec-drawer--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rec-rd-payments-title"
      >
        <div className="rec-drawer__head">
          <h2 id="rec-rd-payments-title" className="rec-drawer__title">
            关联银行付款
            {statementNo ? (
              <span className="rec-drawer__title-sub"> · {statementNo}</span>
            ) : null}
          </h2>
          <button type="button" className="rec-drawer__close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <div className="rec-drawer__body rec-drawer__body--light">
          {loading && <p className="admin-workspace__card-desc">加载中…</p>}
          {error && <p className="admin-workspace__card-desc">{error}</p>}
          {!loading && !error && items.length === 0 && (
            <p className="admin-workspace__card-desc">暂无关联的银行付款登记记录。</p>
          )}
          {!loading && !error && items.length > 0 && (
            <div className="rec-rd-payments-table-wrap">
              <table className="rec-rd-payments-table">
                <thead>
                  <tr>
                    <th>交易日期</th>
                    <th>金额</th>
                    <th>本次关联</th>
                    <th>收款方</th>
                    <th>流水号</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id}>
                      <td>{formatDate(row.trade_date)}</td>
                      <td>{formatAmt(row.amount)}</td>
                      <td>{formatAmt(row.linked_amount ?? row.amount)}</td>
                      <td title={row.payee_name || ''}>{row.payee_name || '—'}</td>
                      <td className="rec-rd-payments-table__mono">{row.transaction_no || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="rec-drawer__footer rec-drawer__footer--light">
          <button type="button" className="rec-btn rec-btn--ghost" onClick={onClose}>
            关闭
          </button>
        </div>
      </aside>
    </>
  )
}

export default ReconciliationRdPaymentsDrawer
