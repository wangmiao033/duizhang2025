import React, { useEffect, useState } from 'react'
import { deleteInvoicePaymentLink } from '@/lib/api/invoicePaymentLink.ts'
import { getInvoiceRecordId } from '@/lib/api/invoice.ts'

const INVOICE_STATUSES = ['未开', '已开', '作废']

function InvoiceLightDrawer({
  open,
  record,
  onClose,
  onUpdateRecord,
  onNavigateToFullEdit,
  onOpenVerification,
  linkedPaymentRows = [],
  onLinksChanged,
  onRequestManualLinkToPayment
}) {
  const [remark, setRemark] = useState('')
  const [status, setStatus] = useState('未开')

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (record) {
      setRemark(record.remark != null ? String(record.remark) : '')
      setStatus(record.status || '未开')
    } else {
      setRemark('')
      setStatus('未开')
    }
  }, [record, open])

  if (!open || !record) return null

  const recordId = getInvoiceRecordId(record)

  const saveRemark = () => {
    const next = remark.trim()
    if ((record.remark || '') === next) return
    void onUpdateRecord?.(recordId, { ...record, remark: next })
  }

  const applyStatus = (nextStatus) => {
    setStatus(nextStatus)
    if ((record.status || '') === nextStatus) return
    void onUpdateRecord?.(recordId, { ...record, status: nextStatus })
  }

  return (
    <>
      <button type="button" className="rec-drawer-backdrop" aria-label="关闭" onClick={onClose} />
      <aside
        className="rec-drawer rec-drawer--light"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-light-drawer-title"
      >
        <div className="rec-drawer__head">
          <h2 id="invoice-light-drawer-title" className="rec-drawer__title">
            快速查看
          </h2>
          <button type="button" className="rec-drawer__close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <div className="rec-drawer__body rec-drawer__body--light">
          <dl className="rec-light-dl">
            <dt>发票抬头</dt>
            <dd>{record.title || '—'}</dd>
            <dt>税号</dt>
            <dd>{record.taxNo || '—'}</dd>
            <dt>金额</dt>
            <dd className="rec-light-dl__emph">¥{parseFloat(record.amount || 0).toFixed(2)}</dd>
            <dt>开票日期</dt>
            <dd>{record.issueDate || '—'}</dd>
            <dt>核销</dt>
            <dd>{record.verified ? `已核销 (${(record.verifiedRecordIds || []).length} 条)` : '未核销'}</dd>
            <dt>关联回款</dt>
            <dd>
              {linkedPaymentRows.length === 0 ? (
                '未关联'
              ) : (
                <ul className="rec-light-link-list">
                  {linkedPaymentRows.map((row) => (
                    <li key={row.linkId}>
                      <span title={row.paymentId}>{row.label}</span>
                      <button
                        type="button"
                        className="rec-btn rec-btn--ghost rec-btn--xs"
                        onClick={() =>
                          void (async () => {
                            try {
                              await deleteInvoicePaymentLink(row.linkId)
                              await onLinksChanged?.()
                            } catch (e) {
                              console.error(e)
                            }
                          })()
                        }
                      >
                        取消关联
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </dd>
          </dl>

          {onRequestManualLinkToPayment ? (
            <div className="rec-light-field">
              <button
                type="button"
                className="rec-btn rec-btn--secondary"
                onClick={() => onRequestManualLinkToPayment(recordId)}
              >
                关联回款…
              </button>
            </div>
          ) : null}

          <div className="rec-light-field">
            <label className="rec-light-field__label" htmlFor="invoice-light-status">
              状态
            </label>
            <select
              id="invoice-light-status"
              className="admin-input"
              value={status}
              onChange={(e) => applyStatus(e.target.value)}
            >
              {INVOICE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="rec-light-field">
            <label className="rec-light-field__label" htmlFor="invoice-light-remark">
              备注
            </label>
            <textarea
              id="invoice-light-remark"
              className="admin-input rec-light-memo"
              rows={3}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              onBlur={saveRemark}
              placeholder="备注"
            />
          </div>
        </div>
        <style>{`
          .rec-light-link-list { margin: 0; padding-left: 18px; list-style: disc; }
          .rec-light-link-list li { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
          .rec-btn--xs { min-height: 26px; padding: 2px 8px; font-size: 12px; }
        `}</style>

        <div className="rec-drawer__footer rec-drawer__footer--light">
          <button type="button" className="rec-btn rec-btn--ghost" onClick={onClose}>
            关闭
          </button>
          {onOpenVerification ? (
            <button
              type="button"
              className="rec-btn rec-btn--secondary"
              onClick={() => {
                onOpenVerification(record)
                onClose()
              }}
            >
              去核销
            </button>
          ) : null}
          <button
            type="button"
            className="rec-btn rec-btn--primary"
            onClick={() => {
              onNavigateToFullEdit?.(recordId)
              onClose()
            }}
          >
            完整编辑
          </button>
        </div>
      </aside>
    </>
  )
}

export default InvoiceLightDrawer

