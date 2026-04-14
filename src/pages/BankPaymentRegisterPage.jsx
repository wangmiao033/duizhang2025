import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import PageContainer from '@/components/layout/PageContainer.jsx'
import { ApiError } from '@/lib/api/client.ts'
import {
  createBankTransaction,
  uploadBankTransactionAttachment
} from '@/lib/api/bankTransaction.ts'
import { buildRdPaymentConfirmPayload } from '@/lib/bank/bankTransactionPayloads.js'
import { apiRowToFrontend, getReconciliationRecord } from '@/lib/api/reconciliation.ts'
import { displaySettlementNumber } from '@/utils/settlementNumber.js'
import '@/components/reconciliation/reconciliation-admin.css'

const INITIAL_RD = {
  reconciliationId: '',
  statementNo: '',
  partner: '',
  game: '',
  payable: '',
  unpaid: '',
  linkedAmount: ''
}

const todayStr = () => new Date().toISOString().slice(0, 10)

const INITIAL_CONFIRM = {
  remittanceAmount: '',
  remittancePurpose: '',
  paymentDate: todayStr(),
  payeeCompany: '',
  remark: '',
  pasteText: ''
}

function BankPaymentRegisterPage() {
  const {
    showToast,
    recon,
    settings,
    bankPaymentReconciliationPrefillId,
    setBankPaymentReconciliationPrefillId
  } = useAppState()
  const { partyA } = settings
  const defaultPayerName = partyA?.invoiceTitle != null ? String(partyA.invoiceTitle).trim() : ''

  const { records, refetchReconciliationFromApi } = recon
  const [confirm, setConfirm] = useState(INITIAL_CONFIRM)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [rdFilter, setRdFilter] = useState('')
  const [rdLink, setRdLink] = useState(INITIAL_RD)
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [attachmentName, setAttachmentName] = useState('')

  const setConfirmField = (key) => (e) => {
    const v = e.target.value
    setConfirm((f) => ({ ...f, [key]: v }))
  }

  const applyFrontendRecordToRdLink = useCallback((rec) => {
    if (!rec || rec.id == null) return
    const id = String(rec.id)
    const payable = parseFloat(String(rec.settlementAmount ?? 0)) || 0
    const unpaidRaw = rec.unpaidAmount != null ? parseFloat(String(rec.unpaidAmount)) : NaN
    const unpaid = Number.isFinite(unpaidRaw) ? unpaidRaw : payable
    const linkDefault = Math.max(0, unpaid)
    const linkStr = linkDefault > 0 ? String(linkDefault) : payable > 0 ? String(payable) : ''
    const month = rec.settlementMonth != null ? String(rec.settlementMonth).trim() : ''
    const purposeDefault = month ? `联运结算款 ${month}` : '联运结算款'
    const partner = rec.partner != null ? String(rec.partner) : ''

    setRdLink({
      reconciliationId: id,
      statementNo: displaySettlementNumber(
        rec.settlementNumber != null ? String(rec.settlementNumber) : '',
        { emptyLabel: '' }
      ),
      partner,
      game: rec.game != null ? String(rec.game) : '',
      payable: payable.toFixed(2),
      unpaid: (Number.isFinite(unpaid) ? unpaid : payable).toFixed(2),
      linkedAmount: linkStr
    })
    setConfirm((c) => ({
      ...c,
      remittanceAmount: linkStr,
      remittancePurpose: purposeDefault,
      paymentDate: todayStr(),
      payeeCompany: partner,
      pasteText: ''
    }))
    setAttachmentUrl('')
    setAttachmentName('')
  }, [])

  useEffect(() => {
    const id = bankPaymentReconciliationPrefillId
    if (id == null || id === '') return
    const consume = () => setBankPaymentReconciliationPrefillId?.(null)

    const local = records.find((r) => String(r.id) === String(id))
    if (local) {
      applyFrontendRecordToRdLink(local)
      showToast('已预选关联的研发对账单', 'success')
      consume()
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const row = await getReconciliationRecord(String(id))
        if (cancelled) return
        applyFrontendRecordToRdLink(apiRowToFrontend(row))
        showToast('已预选关联的研发对账单', 'success')
      } catch (e) {
        if (!cancelled) {
          showToast(
            e instanceof ApiError ? e.message : '无法加载研发对账记录，请从列表重试',
            'info'
          )
        }
      } finally {
        if (!cancelled) consume()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [
    bankPaymentReconciliationPrefillId,
    records,
    setBankPaymentReconciliationPrefillId,
    showToast,
    applyFrontendRecordToRdLink
  ])

  useEffect(() => {
    if (!rdLink.reconciliationId) return
    const v = rdLink.linkedAmount != null ? String(rdLink.linkedAmount).trim() : ''
    if (v) setConfirm((c) => ({ ...c, remittanceAmount: v }))
  }, [rdLink.linkedAmount, rdLink.reconciliationId])

  const filteredRdRecords = useMemo(() => {
    const q = rdFilter.trim().toLowerCase()
    if (!q) return records
    return records.filter((r) => {
      const blob = [r.settlementNumber, r.partner, r.game, r.settlementMonth, r.id]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return blob.includes(q)
    })
  }, [records, rdFilter])

  const handleReset = () => {
    setConfirm({ ...INITIAL_CONFIRM, paymentDate: todayStr() })
    setRdLink(INITIAL_RD)
    setRdFilter('')
    setAttachmentUrl('')
    setAttachmentName('')
    showToast('已清空', 'info')
  }

  const handleAttachment = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const att = await uploadBankTransactionAttachment(file)
      setAttachmentUrl(att.url || '')
      setAttachmentName(file.name)
      showToast('回单已上传', 'success')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : '上传失败', 'info')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const rid = rdLink.reconciliationId?.trim()
    if (!rid) {
      showToast('请选择研发对账单', 'info')
      return
    }
    const linked = parseFloat(String(rdLink.linkedAmount || '').replace(/,/g, ''))
    if (!Number.isFinite(linked) || linked <= 0) {
      showToast('请填写大于 0 的本次付款金额（关联金额）', 'info')
      return
    }
    const amt = parseFloat(String(confirm.remittanceAmount || '').replace(/,/g, ''))
    if (!Number.isFinite(amt) || amt <= 0) {
      showToast('请填写大于 0 的汇款金额', 'info')
      return
    }
    if (!confirm.remittancePurpose?.trim()) {
      showToast('请填写汇款用途', 'info')
      return
    }
    if (!confirm.paymentDate?.trim()) {
      showToast('请选择汇款日期', 'info')
      return
    }
    if (!confirm.payeeCompany?.trim()) {
      showToast('请填写收款单位', 'info')
      return
    }
    if (!attachmentUrl?.trim()) {
      showToast('请上传银行回单（图片或 PDF）', 'info')
      return
    }

    const rdPayload = {
      reconciliation_id: rid,
      reconciliation_type: 'rd',
      reconciliation_no: rdLink.statementNo?.trim() || null,
      linked_amount: linked
    }

    setSaving(true)
    try {
      const body = buildRdPaymentConfirmPayload(
        {
          remittanceAmount: amt,
          remittancePurpose: confirm.remittancePurpose,
          paymentDate: confirm.paymentDate,
          payeeCompany: confirm.payeeCompany,
          remark: confirm.remark,
          attachmentUrl,
          pasteText: confirm.pasteText,
          payerName: defaultPayerName || null
        },
        rdPayload
      )
      await createBankTransaction(body)
      showToast('已提交并完成付款登记', 'success')
      try {
        await refetchReconciliationFromApi?.()
      } catch {
        /* ignore */
      }
      handleReset()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : '保存失败，请检查网络或后端配置', 'info')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageContainer hideHeader className="page-container--admin-workspace">
      <div className="admin-workspace rec-payment-confirm">
        <div className="admin-workspace__card rec-payment-confirm__card">
          <h2 className="rec-payment-confirm__page-title">研发对账付款确认单</h2>
          <p className="admin-workspace__card-desc rec-payment-confirm__lead">
            关联研发对账并确认付款信息；上传回单后提交，写入银行流水台账（付款登记）。
          </p>

          <section className="rec-payment-confirm__section">
            <h3 className="rec-payment-confirm__section-title">一、研发对账关联</h3>
            <div className="rec-bank-rd-link rec-bank-rd-link--compact">
              <div className="rec-bank-rd-link__grid">
                <label className="rec-bank-payment__field">
                  关联业务类型
                  <input className="admin-input" readOnly value="研发对账" />
                </label>
                <label className="rec-bank-payment__field rec-bank-rd-link__field--full">
                  筛选 / 搜索对账单
                  <input
                    className="admin-input"
                    value={rdFilter}
                    onChange={(e) => setRdFilter(e.target.value)}
                    placeholder="对账单号、合作方、游戏…"
                  />
                </label>
                <label className="rec-bank-payment__field rec-bank-rd-link__field--full">
                  选择研发对账单
                  <select
                    className="admin-input"
                    value={rdLink.reconciliationId}
                    onChange={(e) => {
                      const v = e.target.value
                      if (!v) {
                        setRdLink(INITIAL_RD)
                        setConfirm((c) => ({
                          ...c,
                          remittanceAmount: '',
                          remittancePurpose: '',
                          payeeCompany: ''
                        }))
                        setAttachmentUrl('')
                        setAttachmentName('')
                        return
                      }
                      const rec = records.find((r) => String(r.id) === String(v))
                      if (rec) applyFrontendRecordToRdLink(rec)
                    }}
                  >
                    <option value="">请选择</option>
                    {filteredRdRecords.map((r) => (
                      <option key={String(r.id)} value={String(r.id)}>
                        {displaySettlementNumber(r.settlementNumber, { emptyLabel: '无编号' }) +
                          ' · ' +
                          (r.partner || '—') +
                          ' · ' +
                          (r.game || '—')}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="rec-bank-payment__field">
                  对账单号
                  <input className="admin-input" readOnly value={rdLink.statementNo} placeholder="选择后带出" />
                </label>
                <label className="rec-bank-payment__field">
                  合作方
                  <input className="admin-input" readOnly value={rdLink.partner} />
                </label>
                <label className="rec-bank-payment__field">
                  游戏
                  <input className="admin-input" readOnly value={rdLink.game} />
                </label>
                <label className="rec-bank-payment__field">
                  应付金额
                  <input className="admin-input" readOnly value={rdLink.payable} />
                </label>
                <label className="rec-bank-payment__field">
                  未付金额
                  <input className="admin-input" readOnly value={rdLink.unpaid} />
                </label>
                <label className="rec-bank-payment__field">
                  本次付款金额
                  <input
                    className="admin-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={rdLink.linkedAmount}
                    onChange={(e) => setRdLink((s) => ({ ...s, linkedAmount: e.target.value }))}
                    placeholder="关联至本单的金额"
                    disabled={!rdLink.reconciliationId}
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="rec-payment-confirm__section">
            <h3 className="rec-payment-confirm__section-title">二、付款确认信息</h3>
            <form className="rec-payment-confirm__form" onSubmit={handleSubmit}>
              <div className="rec-payment-confirm__fields">
                <label className="rec-bank-payment__field">
                  汇款金额（必填）
                  <input
                    className="admin-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={confirm.remittanceAmount}
                    onChange={setConfirmField('remittanceAmount')}
                    required
                  />
                </label>
                <label className="rec-bank-payment__field rec-bank-rd-link__field--full">
                  汇款用途（必填）
                  <input
                    className="admin-input"
                    value={confirm.remittancePurpose}
                    onChange={setConfirmField('remittancePurpose')}
                    placeholder="联运结算款 + 月份"
                    required
                  />
                </label>
                <label className="rec-bank-payment__field">
                  汇款日期（必填）
                  <input
                    className="admin-input"
                    type="date"
                    value={confirm.paymentDate}
                    onChange={setConfirmField('paymentDate')}
                    required
                  />
                </label>
                <label className="rec-bank-payment__field rec-bank-rd-link__field--full">
                  收款单位（必填）
                  <input
                    className="admin-input"
                    value={confirm.payeeCompany}
                    onChange={setConfirmField('payeeCompany')}
                    required
                  />
                </label>
                <label className="rec-bank-payment__field rec-bank-rd-link__field--full">
                  银行回单（必填，图片或 PDF）
                  <div className="rec-payment-confirm__upload-row">
                    <label className="rec-btn rec-btn--ghost rec-payment-confirm__file-label">
                      {uploading ? '上传中…' : '选择文件'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                        className="rec-payment-confirm__file-input"
                        disabled={uploading}
                        onChange={handleAttachment}
                      />
                    </label>
                    {attachmentName ? (
                      <span className="rec-payment-confirm__file-name">已选：{attachmentName}</span>
                    ) : (
                      <span className="rec-payment-confirm__file-hint">未选择文件</span>
                    )}
                  </div>
                </label>
                <label className="rec-bank-payment__field rec-bank-rd-link__field--full">
                  备注（可选）
                  <input
                    className="admin-input"
                    value={confirm.remark}
                    onChange={setConfirmField('remark')}
                    placeholder="简短说明"
                  />
                </label>
                <label className="rec-bank-payment__field rec-bank-rd-link__field--full">
                  粘贴回单文字（可选）
                  <textarea
                    className="admin-input"
                    rows={2}
                    value={confirm.pasteText}
                    onChange={setConfirmField('pasteText')}
                    placeholder="若有 OCR/复制文本可粘贴，将写入 raw_text"
                  />
                </label>
              </div>

              {defaultPayerName ? (
                <p className="rec-payment-confirm__payer-hint">
                  付款单位（默认）：{defaultPayerName}
                </p>
              ) : null}

              <div className="rec-payment-confirm__actions">
                <button type="button" className="rec-btn rec-btn--ghost" onClick={handleReset}>
                  清空
                </button>
                <button type="submit" className="rec-btn rec-btn--primary" disabled={saving || uploading}>
                  {saving ? '提交中…' : '提交并完成付款'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </PageContainer>
  )
}

export default BankPaymentRegisterPage
