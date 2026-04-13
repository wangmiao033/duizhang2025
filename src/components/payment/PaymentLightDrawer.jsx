import React, { useEffect, useState } from 'react'
import { DELIVERY_STATUSES } from '@/domain/payment/deliveryForm.js'
import { deleteInvoicePaymentLink } from '@/lib/api/invoicePaymentLink.ts'
import { getPaymentRecordId } from '@/lib/api/payment.ts'

function PaymentLightDrawer({
  open,
  record,
  onClose,
  onUpdateRecord,
  onNavigateToFullEdit,
  linkedInvoiceRows = [],
  onLinksChanged,
  onRequestManualLinkToInvoice
}) {
  const [remark, setRemark] = useState('')
  const [status, setStatus] = useState('待寄出')

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
      setStatus(record.status || '待寄出')
    } else {
      setRemark('')
      setStatus('待寄出')
    }
  }, [record, open])

  if (!open || !record) return null

  const recordId = getPaymentRecordId(record)

  const saveRemark = () => {
    const next = remark.trim()
    if ((record.remark || '') === next) return
    void onUpdateRecord?.({ ...record, id: recordId, remark: next })
  }

  const applyStatus = (next) => {
    setStatus(next)
    if ((record.status || '') === next) return
    void onUpdateRecord?.({ ...record, id: recordId, status: next })
  }

  return (
    <>
      <button type="button" className="rec-drawer-backdrop" aria-label="关闭" onClick={onClose} />
      <aside
        className="rec-drawer rec-drawer--light"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-light-drawer-title"
      >
        <div className="rec-drawer__head">
          <h2 id="payment-light-drawer-title" className="rec-drawer__title">
            快速查看
          </h2>
          <button type="button" className="rec-drawer__close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <div className="rec-drawer__body rec-drawer__body--light">
          <dl className="rec-light-dl">
            <dt>快递单号</dt>
            <dd>{record.trackingNumber || '—'}</dd>
            <dt>快递公司</dt>
            <dd>{record.courierCompany || '—'}</dd>
            <dt>收件人</dt>
            <dd>{record.recipient || '—'}</dd>
            <dt>关联客户</dt>
            <dd>{record.partnerName || '—'}</dd>
            <dt>寄出日期</dt>
            <dd>{record.sendDate || '—'}</dd>
            <dt>关联发票</dt>
            <dd>
              {linkedInvoiceRows.length === 0 ? (
                '未关联'
              ) : (
                <ul className="rec-light-link-list">
                  {linkedInvoiceRows.map((row) => (
                    <li key={row.linkId}>
                      <span title={row.invoiceId}>{row.label}</span>
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

          {onRequestManualLinkToInvoice ? (
            <div className="rec-light-field">
              <button
                type="button"
                className="rec-btn rec-btn--secondary"
                onClick={() => onRequestManualLinkToInvoice(recordId)}
              >
                关联发票…
              </button>
            </div>
          ) : null}

          <div className="rec-light-field">
            <label className="rec-light-field__label" htmlFor="payment-light-status">
              状态
            </label>
            <select
              id="payment-light-status"
              className="admin-input"
              value={status}
              onChange={(e) => applyStatus(e.target.value)}
            >
              {DELIVERY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="rec-light-field">
            <label className="rec-light-field__label" htmlFor="payment-light-remark">
              备注
            </label>
            <textarea
              id="payment-light-remark"
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
          .rec-btn--xs { min-height: 26px; padding: 2px 8px; font-size: var(--font-size-caption); font-weight: var(--font-weight-button); }
        `}</style>

        <div className="rec-drawer__footer rec-drawer__footer--light">
          <button type="button" className="rec-btn rec-btn--ghost" onClick={onClose}>
            关闭
          </button>
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

export default PaymentLightDrawer
