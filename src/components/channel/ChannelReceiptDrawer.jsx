import React, { useEffect, useMemo, useState } from 'react'
import { getChannelRecordId, uploadChannelReceiptAttachment } from '@/lib/api/channel.ts'
import {
  getChannelTotals,
  getChannelReceivedAmount,
  getChannelUnpaidAmount
} from '@/domain/channel/channelAggregates.js'

function formatMoney(amount) {
  const n = parseFloat(amount)
  if (!Number.isFinite(n)) return '¥0.00'
  return `¥${n.toFixed(2)}`
}

function buildBankPresetOptions(partyA, partyB) {
  const opts = []
  const add = (prefix, bankName, account) => {
    const b = (bankName || '').trim()
    const a = (account || '').trim()
    if (!b && !a) return
    const line = [b, a].filter(Boolean).join(' ')
    opts.push({ value: line, label: `${prefix}${line}` })
  }
  add('甲方 · ', partyA?.bankName, partyA?.bankAccount)
  add('乙方 · ', partyB?.bankName, partyB?.bankAccount)
  return opts
}

/**
 * 渠道对账收款登记：写入 channel_receipts 并刷新主表已收/状态
 */
function ChannelReceiptDrawer({
  open,
  record,
  partyA,
  partyB,
  channelApiEnabled,
  showToast,
  onClose,
  onRegisterReceipt
}) {
  const [amount, setAmount] = useState('')
  const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [bankSelect, setBankSelect] = useState('')
  const [bankCustom, setBankCustom] = useState('')
  const [remark, setRemark] = useState('')
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const bankPresets = useMemo(() => buildBankPresetOptions(partyA, partyB), [partyA, partyB])

  useEffect(() => {
    if (!open || !record) return
    setAmount('')
    setReceiptDate(new Date().toISOString().slice(0, 10))
    setBankSelect(bankPresets.length ? bankPresets[0].value : '__custom__')
    setBankCustom('')
    setRemark('')
    setFile(null)
  }, [open, record?.id, bankPresets])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open || !record) return null

  const recordId = getChannelRecordId(record)
  const totals = getChannelTotals(record)
  const receivable = totals.settlementAmount
  const received = getChannelReceivedAmount(record)
  const unpaid = getChannelUnpaidAmount(record)

  const resolveBankAccount = () => {
    if (bankSelect === '__custom__') return bankCustom.trim() || null
    return bankSelect.trim() || null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amt = parseFloat(String(amount).replace(/,/g, ''))
    if (!Number.isFinite(amt) || amt <= 0) {
      showToast?.('请输入大于 0 的收款金额', 'error')
      return
    }
    const bank_account = resolveBankAccount()
    if (!bank_account) {
      showToast?.('请选择或填写收款账户', 'error')
      return
    }
    if (!channelApiEnabled) {
      showToast?.('当前为离线模式，无法登记收款', 'error')
      return
    }
    setSubmitting(true)
    let attachment_url = null
    try {
      if (file) {
        const up = await uploadChannelReceiptAttachment(file)
        attachment_url = up.url
      }
      const ok = await onRegisterReceipt?.(recordId, {
        amount: amt,
        receipt_date: receiptDate || null,
        bank_account,
        remark: remark.trim() || null,
        attachment_url
      })
      if (ok) onClose?.()
    } catch (err) {
      console.error(err)
      showToast?.('上传或提交失败，请重试', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button type="button" className="rec-drawer-backdrop" aria-label="关闭" onClick={onClose} />
      <aside
        className="rec-drawer rec-drawer--light channel-receipt-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="channel-receipt-drawer-title"
      >
        <div className="rec-drawer__head">
          <h2 id="channel-receipt-drawer-title" className="rec-drawer__title">
            收款登记
          </h2>
          <button type="button" className="rec-drawer__close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <div className="rec-drawer__body rec-drawer__body--light">
          {!channelApiEnabled ? (
            <p className="channel-receipt-offline muted">离线模式下无法登记收款，请恢复渠道 API 连接。</p>
          ) : null}

          <div className="channel-receipt-section">
            <div className="channel-receipt-section__title">对账信息</div>
            <dl className="rec-light-dl">
              <dt>渠道名称</dt>
              <dd>{record.channelName || '—'}</dd>
              <dt>结算周期</dt>
              <dd>
                {record.settlementMonth ? `${record.settlementMonth} · ` : ''}
                {record.startDate || '—'} ~ {record.endDate || '—'}
              </dd>
              <dt>应收金额</dt>
              <dd className="rec-light-dl__emph">{formatMoney(receivable)}</dd>
              <dt>已收金额</dt>
              <dd>{formatMoney(received)}</dd>
              <dt>未收金额</dt>
              <dd>{formatMoney(unpaid)}</dd>
            </dl>
          </div>

          <form className="channel-receipt-section" onSubmit={handleSubmit}>
            <div className="channel-receipt-section__title">收款录入</div>
            <div className="channel-receipt-form-grid">
              <div className="form-group">
                <label htmlFor="channel-receipt-amount">收款金额 *</label>
                <input
                  id="channel-receipt-amount"
                  type="number"
                  className="admin-input"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="元"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="channel-receipt-date">收款日期</label>
                <input
                  id="channel-receipt-date"
                  type="date"
                  className="admin-input"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="channel-receipt-bank">收款账户 *</label>
                <select
                  id="channel-receipt-bank"
                  className="admin-input"
                  value={bankSelect}
                  onChange={(e) => setBankSelect(e.target.value)}
                >
                  {bankPresets.length === 0 ? (
                    <option value="__custom__">手动填写账户</option>
                  ) : (
                    bankPresets.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))
                  )}
                  {bankPresets.length > 0 ? (
                    <option value="__custom__">手动填写</option>
                  ) : null}
                </select>
                {bankSelect === '__custom__' ? (
                  <input
                    type="text"
                    className="admin-input channel-receipt-bank-custom"
                    value={bankCustom}
                    onChange={(e) => setBankCustom(e.target.value)}
                    placeholder="开户行 / 账号"
                  />
                ) : null}
              </div>
              <div className="form-group full-width">
                <label htmlFor="channel-receipt-remark">备注</label>
                <input
                  id="channel-receipt-remark"
                  type="text"
                  className="admin-input"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="选填"
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="channel-receipt-file">附件（银行回单）</label>
                <input
                  id="channel-receipt-file"
                  type="file"
                  className="channel-receipt-file"
                  accept="image/*,.pdf,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                {file ? <span className="muted channel-receipt-file-name">{file.name}</span> : null}
              </div>
            </div>
            <div className="channel-receipt-actions">
              <button type="button" className="rec-btn rec-btn--secondary" onClick={onClose} disabled={submitting}>
                取消
              </button>
              <button
                type="submit"
                className="rec-btn rec-btn--primary"
                disabled={submitting || !channelApiEnabled}
              >
                {submitting ? '提交中…' : '确认收款'}
              </button>
            </div>
          </form>
        </div>
      </aside>
    </>
  )
}

export default ChannelReceiptDrawer
