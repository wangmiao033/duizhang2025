import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '@/lib/api/client.ts'
import {
  deleteBankPaymentAttachment,
  getReconciliationBankPayment,
  getReconciliationRecordId,
  listBankPaymentAttachments,
  uploadBankPaymentAttachment,
  upsertReconciliationBankPayment
} from '@/lib/api/reconciliation.ts'
import { displaySettlementNumber } from '@/utils/settlementNumber.js'

const EMPTY_FORM = {
  transaction_serial: '',
  authorization_status: '',
  remittance_amount: '',
  remittance_purpose: '',
  payment_remark: '',
  is_scheduled: false,
  payment_date: '',
  transfer_status: 'pending_submit',
  remitter_company: '',
  remitter_account: '',
  remitter_bank_name: '',
  payee_company: '',
  payee_account: '',
  payee_bank_name: '',
  submitter_user_id: '',
  first_approver_user_id: '',
  first_approval_at: '',
  bank_feedback: '',
  instruction_channel: '',
  is_personal_payee: false
}

function apiRowToForm(row) {
  if (!row) return { ...EMPTY_FORM }
  return {
    transaction_serial: row.transaction_serial ?? '',
    authorization_status: row.authorization_status ?? '',
    remittance_amount:
      row.remittance_amount != null && row.remittance_amount !== ''
        ? String(row.remittance_amount)
        : '',
    remittance_purpose: row.remittance_purpose ?? '',
    payment_remark: row.payment_remark ?? '',
    is_scheduled: Boolean(row.is_scheduled),
    payment_date: row.payment_date ?? '',
    transfer_status: row.transfer_status || 'pending_submit',
    remitter_company: row.remitter_company ?? '',
    remitter_account: row.remitter_account ?? '',
    remitter_bank_name: row.remitter_bank_name ?? '',
    payee_company: row.payee_company ?? '',
    payee_account: row.payee_account ?? '',
    payee_bank_name: row.payee_bank_name ?? '',
    submitter_user_id: row.submitter_user_id ?? '',
    first_approver_user_id: row.first_approver_user_id ?? '',
    first_approval_at: row.first_approval_at
      ? String(row.first_approval_at).slice(0, 16)
      : '',
    bank_feedback: row.bank_feedback ?? '',
    instruction_channel: row.instruction_channel ?? '',
    is_personal_payee: Boolean(row.is_personal_payee)
  }
}

function formToPayload(form) {
  const rem = parseFloat(String(form.remittance_amount).replace(/,/g, ''))
  return {
    transaction_serial: form.transaction_serial.trim() || null,
    authorization_status: form.authorization_status.trim() || null,
    remittance_amount: Number.isFinite(rem) ? rem : 0,
    remittance_purpose: form.remittance_purpose.trim() || null,
    payment_remark: form.payment_remark.trim() || null,
    is_scheduled: Boolean(form.is_scheduled),
    payment_date: form.payment_date.trim() || null,
    transfer_status: form.transfer_status || 'pending_submit',
    remitter_company: form.remitter_company.trim() || null,
    remitter_account: form.remitter_account.trim() || null,
    remitter_bank_name: form.remitter_bank_name.trim() || null,
    payee_company: form.payee_company.trim() || null,
    payee_account: form.payee_account.trim() || null,
    payee_bank_name: form.payee_bank_name.trim() || null,
    submitter_user_id: form.submitter_user_id.trim() || null,
    first_approver_user_id: form.first_approver_user_id.trim() || null,
    first_approval_at: (() => {
      const t = form.first_approval_at.trim()
      if (!t) return null
      const d = new Date(t)
      return Number.isNaN(d.getTime()) ? null : d.toISOString()
    })(),
    bank_feedback: form.bank_feedback.trim() || null,
    instruction_channel: form.instruction_channel.trim() || null,
    is_personal_payee: Boolean(form.is_personal_payee)
  }
}

/**
 * 研发对账 — 付款流水单（打款登记）抽屉
 */
function ReconciliationBankPaymentDrawer({ open, record, onClose, onSaved, showToast }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM }))
  const [attachments, setAttachments] = useState([])

  const reconId = record ? getReconciliationRecordId(record) : ''
  const payable = useMemo(
    () => (record ? parseFloat(record.settlementAmount || 0) : 0),
    [record]
  )
  const paid = useMemo(() => {
    const r = parseFloat(String(form.remittance_amount).replace(/,/g, ''))
    return Number.isFinite(r) ? r : 0
  }, [form.remittance_amount])
  const diff = useMemo(() => Math.round((paid - payable) * 100) / 100, [paid, payable])
  const amountOk = useMemo(() => Math.abs(diff) < 0.01, [diff])

  const load = useCallback(async () => {
    if (!reconId) return
    setLoading(true)
    try {
      const [row, attRes] = await Promise.all([
        getReconciliationBankPayment(reconId),
        listBankPaymentAttachments(reconId)
      ])
      setForm(apiRowToForm(row))
      setAttachments(attRes.items || [])
    } catch (e) {
      console.error(e)
      showToast?.('加载付款流水单失败', 'error')
      setForm({ ...EMPTY_FORM })
      setAttachments([])
    } finally {
      setLoading(false)
    }
  }, [reconId, showToast])

  const openAttachment = async (att) => {
    const path = att.file_url.startsWith('http') ? att.file_url : `${API_BASE_URL}${att.file_url}`
    try {
      const res = await fetch(path, { credentials: 'include' })
      if (!res.ok) throw new Error(String(res.status))
      const blob = await res.blob()
      const objUrl = URL.createObjectURL(blob)
      window.open(objUrl, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => URL.revokeObjectURL(objUrl), 60_000)
    } catch (err) {
      console.error(err)
      showToast?.('无法打开附件，请检查登录或网络', 'error')
    }
  }

  const onPickFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !reconId) return
    setUploading(true)
    try {
      await uploadBankPaymentAttachment(reconId, file)
      showToast?.('附件已上传', 'success')
      const { items } = await listBankPaymentAttachments(reconId)
      setAttachments(items || [])
      onSaved?.()
    } catch (err) {
      console.error(err)
      showToast?.('上传失败：仅支持图片或 PDF，且单文件不超过 20MB', 'error')
    } finally {
      setUploading(false)
    }
  }

  const removeAttachment = async (att) => {
    if (!reconId || !att?.id) return
    if (!window.confirm(`确定删除附件「${att.file_name}」？`)) return
    try {
      await deleteBankPaymentAttachment(reconId, att.id)
      showToast?.('已删除附件', 'success')
      setAttachments((prev) => prev.filter((a) => a.id !== att.id))
      onSaved?.()
    } catch (err) {
      console.error(err)
      showToast?.('删除失败', 'error')
    }
  }

  useEffect(() => {
    if (!open || !reconId) return
    load()
  }, [open, reconId, load])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const save = async () => {
    if (!reconId) return
    setSaving(true)
    try {
      await upsertReconciliationBankPayment(reconId, formToPayload(form))
      showToast?.('付款流水单已保存', 'success')
      onSaved?.()
      onClose?.()
    } catch (e) {
      console.error(e)
      showToast?.('保存失败，请稍后重试', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!open || !record) return null

  return (
    <>
      <button type="button" className="rec-drawer-backdrop" aria-label="关闭" onClick={onClose} />
      <aside
        className="rec-drawer rec-drawer--bank-payment"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rec-bank-payment-title"
      >
        <div className="rec-drawer__head">
          <h2 id="rec-bank-payment-title" className="rec-drawer__title">
            付款流水单
          </h2>
          <button type="button" className="rec-drawer__close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <div className="rec-drawer__body rec-bank-payment__body">
          {loading ? (
            <p className="rec-bank-payment__loading">加载中…</p>
          ) : (
            <>
              <section className="rec-bank-payment__section">
                <h3 className="rec-bank-payment__section-title">关联账单（只读）</h3>
                <dl className="rec-bank-payment__dl">
                  <dt>结算单编号</dt>
                  <dd>{displaySettlementNumber(record.settlementNumber, { emptyLabel: '—' })}</dd>
                  <dt>结算月份</dt>
                  <dd>{record.settlementMonth || '—'}</dd>
                  <dt>合作方 / 研发公司</dt>
                  <dd>{record.partner || '—'}</dd>
                  <dt>游戏</dt>
                  <dd>{record.game || '—'}</dd>
                  <dt>应付金额</dt>
                  <dd className="rec-bank-payment__money">¥{payable.toFixed(2)}</dd>
                </dl>
              </section>

              <section className="rec-bank-payment__section">
                <h3 className="rec-bank-payment__section-title">付款基础信息</h3>
                <div className="rec-bank-payment__grid">
                  <label className="rec-bank-payment__field">
                    <span>交易序号</span>
                    <input
                      className="admin-input"
                      value={form.transaction_serial}
                      onChange={(e) => setForm((f) => ({ ...f, transaction_serial: e.target.value }))}
                    />
                  </label>
                  <label className="rec-bank-payment__field">
                    <span>授权状态</span>
                    <input
                      className="admin-input"
                      value={form.authorization_status}
                      onChange={(e) => setForm((f) => ({ ...f, authorization_status: e.target.value }))}
                    />
                  </label>
                  <label className="rec-bank-payment__field">
                    <span>汇款金额</span>
                    <input
                      className="admin-input"
                      type="number"
                      step="0.01"
                      value={form.remittance_amount}
                      onChange={(e) => setForm((f) => ({ ...f, remittance_amount: e.target.value }))}
                    />
                  </label>
                  <label className="rec-bank-payment__field">
                    <span>汇款用途</span>
                    <input
                      className="admin-input"
                      value={form.remittance_purpose}
                      onChange={(e) => setForm((f) => ({ ...f, remittance_purpose: e.target.value }))}
                    />
                  </label>
                  <label className="rec-bank-payment__field rec-bank-payment__field--full">
                    <span>备注</span>
                    <textarea
                      className="admin-input"
                      rows={2}
                      value={form.payment_remark}
                      onChange={(e) => setForm((f) => ({ ...f, payment_remark: e.target.value }))}
                    />
                  </label>
                  <label className="rec-bank-payment__field rec-bank-payment__check">
                    <input
                      type="checkbox"
                      checked={form.is_scheduled}
                      onChange={(e) => setForm((f) => ({ ...f, is_scheduled: e.target.checked }))}
                    />
                    <span>是否预约执行</span>
                  </label>
                  <label className="rec-bank-payment__field">
                    <span>打款日期</span>
                    <input
                      className="admin-input"
                      type="date"
                      value={form.payment_date}
                      onChange={(e) => setForm((f) => ({ ...f, payment_date: e.target.value }))}
                    />
                  </label>
                  <label className="rec-bank-payment__field">
                    <span>打款状态</span>
                    <select
                      className="admin-input"
                      value={form.transfer_status}
                      onChange={(e) => setForm((f) => ({ ...f, transfer_status: e.target.value }))}
                    >
                      <option value="pending_submit">待提交</option>
                      <option value="submitted">已提交</option>
                      <option value="paid">已支付</option>
                      <option value="failed">已失败</option>
                    </select>
                  </label>
                </div>
              </section>

              <section className="rec-bank-payment__section">
                <h3 className="rec-bank-payment__section-title">付款方信息</h3>
                <div className="rec-bank-payment__grid">
                  <label className="rec-bank-payment__field rec-bank-payment__field--full">
                    <span>汇款单位</span>
                    <input
                      className="admin-input"
                      value={form.remitter_company}
                      onChange={(e) => setForm((f) => ({ ...f, remitter_company: e.target.value }))}
                    />
                  </label>
                  <label className="rec-bank-payment__field">
                    <span>汇款账号</span>
                    <input
                      className="admin-input"
                      value={form.remitter_account}
                      onChange={(e) => setForm((f) => ({ ...f, remitter_account: e.target.value }))}
                    />
                  </label>
                  <label className="rec-bank-payment__field rec-bank-payment__field--full">
                    <span>汇款单位开户行名称</span>
                    <input
                      className="admin-input"
                      value={form.remitter_bank_name}
                      onChange={(e) => setForm((f) => ({ ...f, remitter_bank_name: e.target.value }))}
                    />
                  </label>
                </div>
              </section>

              <section className="rec-bank-payment__section">
                <h3 className="rec-bank-payment__section-title">收款方信息</h3>
                <div className="rec-bank-payment__grid">
                  <label className="rec-bank-payment__field rec-bank-payment__field--full">
                    <span>收款单位</span>
                    <input
                      className="admin-input"
                      value={form.payee_company}
                      onChange={(e) => setForm((f) => ({ ...f, payee_company: e.target.value }))}
                    />
                  </label>
                  <label className="rec-bank-payment__field">
                    <span>收款账号</span>
                    <input
                      className="admin-input"
                      value={form.payee_account}
                      onChange={(e) => setForm((f) => ({ ...f, payee_account: e.target.value }))}
                    />
                  </label>
                  <label className="rec-bank-payment__field rec-bank-payment__field--full">
                    <span>收款单位开户行名称</span>
                    <input
                      className="admin-input"
                      value={form.payee_bank_name}
                      onChange={(e) => setForm((f) => ({ ...f, payee_bank_name: e.target.value }))}
                    />
                  </label>
                </div>
              </section>

              <section className="rec-bank-payment__section">
                <h3 className="rec-bank-payment__section-title">审批与银行反馈</h3>
                <div className="rec-bank-payment__grid">
                  <label className="rec-bank-payment__field">
                    <span>支付提交人 ID</span>
                    <input
                      className="admin-input"
                      value={form.submitter_user_id}
                      onChange={(e) => setForm((f) => ({ ...f, submitter_user_id: e.target.value }))}
                    />
                  </label>
                  <label className="rec-bank-payment__field">
                    <span>第一授权人 ID</span>
                    <input
                      className="admin-input"
                      value={form.first_approver_user_id}
                      onChange={(e) => setForm((f) => ({ ...f, first_approver_user_id: e.target.value }))}
                    />
                  </label>
                  <label className="rec-bank-payment__field">
                    <span>一次批复时间</span>
                    <input
                      className="admin-input"
                      type="datetime-local"
                      value={form.first_approval_at}
                      onChange={(e) => setForm((f) => ({ ...f, first_approval_at: e.target.value }))}
                    />
                  </label>
                  <label className="rec-bank-payment__field rec-bank-payment__field--full">
                    <span>银行反馈信息</span>
                    <textarea
                      className="admin-input"
                      rows={2}
                      value={form.bank_feedback}
                      onChange={(e) => setForm((f) => ({ ...f, bank_feedback: e.target.value }))}
                    />
                  </label>
                  <label className="rec-bank-payment__field">
                    <span>指令受理渠道</span>
                    <input
                      className="admin-input"
                      value={form.instruction_channel}
                      onChange={(e) => setForm((f) => ({ ...f, instruction_channel: e.target.value }))}
                    />
                  </label>
                  <label className="rec-bank-payment__field rec-bank-payment__check">
                    <input
                      type="checkbox"
                      checked={form.is_personal_payee}
                      onChange={(e) => setForm((f) => ({ ...f, is_personal_payee: e.target.checked }))}
                    />
                    <span>是否向个人账户汇款</span>
                  </label>
                </div>
              </section>

              <section className="rec-bank-payment__section">
                <h3 className="rec-bank-payment__section-title">付款附件</h3>
                <p className="rec-bank-payment__attach-hint">
                  支持银行回单截图或 PDF（单文件不超过 20MB）。上传会自动创建付款流水单空记录（若尚未保存表单）。
                </p>
                <div className="rec-bank-payment__attach-toolbar">
                  <label className="rec-btn rec-btn--ghost rec-bank-payment__upload-label">
                    {uploading ? '上传中…' : '选择文件上传'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.pdf"
                      className="rec-bank-payment__file-input"
                      disabled={uploading || saving}
                      onChange={onPickFile}
                    />
                  </label>
                </div>
                {attachments.length === 0 ? (
                  <p className="rec-bank-payment__attach-empty">暂无附件</p>
                ) : (
                  <ul className="rec-bank-payment__attach-list">
                    {attachments.map((att) => (
                      <li key={att.id} className="rec-bank-payment__attach-item">
                        <span className="rec-bank-payment__attach-name" title={att.file_name}>
                          {att.file_name}
                        </span>
                        <span className="rec-bank-payment__attach-meta">
                          {att.file_type?.includes('pdf') ? 'PDF' : '图片'}
                        </span>
                        <div className="rec-bank-payment__attach-actions">
                          <button
                            type="button"
                            className="rec-btn rec-btn--ghost rec-btn--xs"
                            onClick={() => openAttachment(att)}
                          >
                            查看
                          </button>
                          <button
                            type="button"
                            className="rec-btn rec-btn--ghost rec-btn--xs"
                            onClick={() => removeAttachment(att)}
                          >
                            删除
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>

        <div className="rec-drawer__footer rec-bank-payment__footer">
          <div className="rec-bank-payment__summary">
            <div className="rec-bank-payment__summary-row">
              <span>应付金额</span>
              <strong>¥{payable.toFixed(2)}</strong>
            </div>
            <div className="rec-bank-payment__summary-row">
              <span>实付金额</span>
              <strong>¥{paid.toFixed(2)}</strong>
            </div>
            <div className="rec-bank-payment__summary-row">
              <span>差额</span>
              <strong className={amountOk ? '' : 'rec-bank-payment__summary-warn'}>
                {'\u00a5'}{diff.toFixed(2)}
              </strong>
            </div>
            <div
              className={`rec-bank-payment__summary-badge ${amountOk ? 'is-ok' : 'is-bad'}`}
            >
              {amountOk ? '金额一致' : '金额异常'}
            </div>
          </div>
          <div className="rec-bank-payment__footer-actions">
            <button type="button" className="rec-btn rec-btn--ghost" onClick={onClose} disabled={saving}>
              取消
            </button>
            <button type="button" className="rec-btn rec-btn--primary" onClick={save} disabled={saving || loading}>
              {saving ? '保存中…' : '保存'}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default ReconciliationBankPaymentDrawer
