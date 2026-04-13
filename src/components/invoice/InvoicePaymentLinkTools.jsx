import React, { useEffect, useState } from 'react'
import { ApiError } from '@/lib/api/client.ts'
import { autoMatchInvoicePayments, createInvoicePaymentLink } from '@/lib/api/invoicePaymentLink.ts'
import { getInvoiceRecordId } from '@/lib/api/invoice.ts'
import { getPaymentRecordId } from '@/lib/api/payment.ts'

/**
 * 发票页 / 回款页共用：自动匹配、手动关联、候选结果弹层
 */
function InvoicePaymentLinkTools({
  invoiceRecords,
  deliveries,
  onLinksChanged,
  showToast,
  focusInvoiceId = '',
  onConsumedFocusInvoice,
  focusPaymentId = '',
  onConsumedFocusPayment
}) {
  const [autoOpen, setAutoOpen] = useState(false)
  const [autoBusy, setAutoBusy] = useState(false)
  const [candidates, setCandidates] = useState([])
  const [manualOpen, setManualOpen] = useState(false)
  const [manualInvoiceId, setManualInvoiceId] = useState('')
  const [manualPaymentId, setManualPaymentId] = useState('')
  const [linkingId, setLinkingId] = useState(null)

  useEffect(() => {
    if (!focusInvoiceId) return
    setManualInvoiceId(focusInvoiceId)
    setManualOpen(true)
    onConsumedFocusInvoice?.()
  }, [focusInvoiceId, onConsumedFocusInvoice])

  useEffect(() => {
    if (!focusPaymentId) return
    setManualPaymentId(focusPaymentId)
    setManualOpen(true)
    onConsumedFocusPayment?.()
  }, [focusPaymentId, onConsumedFocusPayment])

  const runAutoMatch = async () => {
    setAutoBusy(true)
    try {
      const res = await autoMatchInvoicePayments({ min_score: 0.55, limit: 200 })
      setCandidates(res.candidates || [])
      setAutoOpen(true)
      if (!res.candidates?.length) {
        showToast?.('未发现达到阈值的候选（可尝试在回款备注中写明金额）', 'info')
      }
    } catch (e) {
      console.error(e)
      showToast?.('自动匹配请求失败', 'error')
    } finally {
      setAutoBusy(false)
    }
  }

  const submitManual = async () => {
    if (!manualInvoiceId || !manualPaymentId) {
      showToast?.('请选择发票与回款记录', 'error')
      return
    }
    try {
      await createInvoicePaymentLink({
        invoice_id: manualInvoiceId,
        payment_id: manualPaymentId,
        match_type: 'manual'
      })
      showToast?.('已建立关联', 'success')
      setManualOpen(false)
      await onLinksChanged?.()
    } catch (e) {
      console.error(e)
      const dup = e instanceof ApiError && e.status === 409
      showToast?.(dup ? '该组合已关联' : '建立关联失败', 'error')
    }
  }

  const linkCandidate = async (invoice_id, payment_id) => {
    const key = `${invoice_id}:${payment_id}`
    setLinkingId(key)
    try {
      const cand = candidates.find((c) => c.invoice_id === invoice_id && c.payment_id === payment_id)
      await createInvoicePaymentLink({
        invoice_id,
        payment_id,
        match_type: 'auto',
        match_score: cand != null ? Number(cand.match_score) : 0
      })
      showToast?.('已建立关联', 'success')
      setCandidates((prev) => prev.filter((c) => !(c.invoice_id === invoice_id && c.payment_id === payment_id)))
      await onLinksChanged?.()
    } catch (e) {
      console.error(e)
      showToast?.('建立关联失败', 'error')
    } finally {
      setLinkingId(null)
    }
  }

  return (
    <>
      <button
        type="button"
        className="rec-btn rec-btn--secondary"
        disabled={autoBusy}
        onClick={() => void runAutoMatch()}
      >
        {autoBusy ? '匹配中…' : '发票-回款自动匹配'}
      </button>
      <button type="button" className="rec-btn rec-btn--secondary" onClick={() => setManualOpen(true)}>
        手动关联
      </button>

      {manualOpen ? (
        <>
          <button type="button" className="rec-drawer-backdrop" aria-label="关闭" onClick={() => setManualOpen(false)} />
          <div className="ip-link-modal" role="dialog" aria-modal="true" aria-labelledby="ip-link-manual-title">
            <div className="ip-link-modal__panel">
              <h3 id="ip-link-manual-title">手动关联发票与回款</h3>
              <label className="ip-link-modal__field">
                <span>发票</span>
                <select
                  className="admin-input"
                  value={manualInvoiceId}
                  onChange={(e) => setManualInvoiceId(e.target.value)}
                >
                  <option value="">请选择</option>
                  {(invoiceRecords || []).map((inv) => {
                    const id = getInvoiceRecordId(inv)
                    return (
                      <option key={id} value={id}>
                        {`${(inv.title || '无抬头').slice(0, 24)} · ${inv.amount || '0'} · ${id.slice(0, 8)}…`}
                      </option>
                    )
                  })}
                </select>
              </label>
              <label className="ip-link-modal__field">
                <span>回款登记</span>
                <select
                  className="admin-input"
                  value={manualPaymentId}
                  onChange={(e) => setManualPaymentId(e.target.value)}
                >
                  <option value="">请选择</option>
                  {(deliveries || []).map((d) => {
                    const id = getPaymentRecordId(d)
                    return (
                      <option key={id} value={id}>
                        {(d.partnerName || d.trackingNumber || '回款').slice(0, 20)} · {id.slice(0, 8)}…
                      </option>
                    )
                  })}
                </select>
              </label>
              <div className="ip-link-modal__actions">
                <button type="button" className="rec-btn rec-btn--ghost" onClick={() => setManualOpen(false)}>
                  取消
                </button>
                <button type="button" className="rec-btn rec-btn--primary" onClick={() => void submitManual()}>
                  建立关联
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {autoOpen ? (
        <>
          <button type="button" className="rec-drawer-backdrop" aria-label="关闭" onClick={() => setAutoOpen(false)} />
          <div className="ip-link-modal ip-link-modal--wide" role="dialog" aria-modal="true">
            <div className="ip-link-modal__panel">
              <h3>自动匹配候选（{candidates.length}）</h3>
              <p className="ip-link-modal__hint">以下为规则打分达到阈值的对；点击「建立关联」写入关联表。已关联的对不会重复出现。</p>
              <div className="ip-link-modal__table-wrap">
                <table className="ip-link-modal__table">
                  <thead>
                    <tr>
                      <th>得分</th>
                      <th>发票</th>
                      <th>回款</th>
                      <th>文本/金额/日期</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((c) => (
                      <tr key={`${c.invoice_id}-${c.payment_id}`}>
                        <td>{c.match_score}</td>
                        <td title={c.invoice_id}>{(c.invoice_title || c.invoice_id).slice(0, 20)}</td>
                        <td title={c.payment_id}>{(c.payment_summary || c.payment_id).slice(0, 28)}</td>
                        <td className="ip-link-modal__scores">
                          {c.scores.text}/{c.scores.amount}/{c.scores.date}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="rec-btn rec-btn--primary rec-btn--sm"
                            disabled={linkingId === `${c.invoice_id}:${c.payment_id}`}
                            onClick={() => void linkCandidate(c.invoice_id, c.payment_id)}
                          >
                            建立关联
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="ip-link-modal__actions">
                <button type="button" className="rec-btn rec-btn--ghost" onClick={() => setAutoOpen(false)}>
                  关闭
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      <style>{`
        .ip-link-modal { position: fixed; inset: 0; z-index: 10050; display: flex; align-items: center; justify-content: center; pointer-events: none; }
        .ip-link-modal__panel { pointer-events: auto; background: var(--admin-card-bg, #fff); border: 1px solid var(--admin-border-soft, #e5e7eb); border-radius: var(--admin-radius, 12px); padding: 20px; max-width: 520px; width: 92%; box-shadow: var(--admin-shadow-md, 0 8px 24px rgba(0,0,0,.12)); }
        .ip-link-modal--wide .ip-link-modal__panel { max-width: 900px; }
        .ip-link-modal__panel h3 { margin: 0 0 12px; font-size: var(--font-size-card-title); font-weight: var(--font-weight-card-title); line-height: var(--line-height-section); color: var(--admin-text-main, #111); }
        .ip-link-modal__hint { margin: 0 0 12px; font-size: var(--font-size-button); font-weight: var(--font-weight-body); line-height: var(--line-height-caption); color: var(--admin-text-muted, #6b7280); }
        .ip-link-modal__field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
        .ip-link-modal__field span { font-size: var(--font-size-caption); font-weight: var(--font-weight-body); color: var(--admin-text-sub, #6b7280); }
        .ip-link-modal__actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
        .ip-link-modal__table-wrap { overflow: auto; max-height: 50vh; border: 1px solid var(--admin-border-soft, #e5e7eb); border-radius: 8px; }
        .ip-link-modal__table { width: 100%; border-collapse: collapse; font-size: var(--font-size-button); line-height: var(--line-height-table-cell); }
        .ip-link-modal__table th, .ip-link-modal__table td { padding: 8px 10px; text-align: left; border-bottom: 1px solid var(--admin-border-soft, #eee); }
        .ip-link-modal__table th { background: var(--admin-elevated-bg, #f9fafb); font-size: var(--font-size-table-header); font-weight: var(--font-weight-table-header); }
        .ip-link-modal__scores { font-variant-numeric: tabular-nums; color: var(--admin-text-muted, #6b7280); white-space: nowrap; }
        .rec-btn--sm { padding: 4px 10px; font-size: var(--font-size-caption); font-weight: var(--font-weight-button); min-height: 28px; }
      `}</style>
    </>
  )
}

export default InvoicePaymentLinkTools
