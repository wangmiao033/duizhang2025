import React, { useEffect, useMemo, useState } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import PageContainer from '@/components/layout/PageContainer.jsx'
import BankPasteAutoParseBlock from '@/components/bank/BankPasteAutoParseBlock.jsx'
import { ApiError } from '@/lib/api/client.ts'
import { createBankTransaction } from '@/lib/api/bankTransaction.ts'
import { buildPaymentRegisterPayload } from '@/lib/bank/bankTransactionPayloads.js'
import { parseBankText } from '@/utils/parseBankText.js'
import { icbcToPaymentFormPatch, parseIcbcReceiptText } from '@/utils/parseIcbcReceipt.js'
import { apiRowToFrontend, getReconciliationRecord } from '@/lib/api/reconciliation.ts'
import '@/components/reconciliation/reconciliation-admin.css'

const INITIAL = {
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
  is_personal_payee: false,
  remittance_method: ''
}

const INITIAL_RD = {
  reconciliationId: '',
  statementNo: '',
  partner: '',
  game: '',
  payable: '',
  unpaid: '',
  linkedAmount: ''
}

function BankPaymentRegisterPage() {
  const {
    showToast,
    recon,
    bankPaymentReconciliationPrefillId,
    setBankPaymentReconciliationPrefillId
  } = useAppState()
  const { records, refetchReconciliationFromApi } = recon
  const [form, setForm] = useState(INITIAL)
  const [pasteText, setPasteText] = useState('')
  const [saving, setSaving] = useState(false)
  const [rdFilter, setRdFilter] = useState('')
  const [rdLink, setRdLink] = useState(INITIAL_RD)

  const set =
    (key) =>
    (e) => {
      const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
      setForm((f) => ({ ...f, [key]: v }))
    }

  const applyFrontendRecordToRdLink = (rec) => {
    if (!rec || rec.id == null) return
    const id = String(rec.id)
    const payable = parseFloat(String(rec.settlementAmount ?? 0)) || 0
    const unpaidRaw = rec.unpaidAmount != null ? parseFloat(String(rec.unpaidAmount)) : NaN
    const unpaid = Number.isFinite(unpaidRaw) ? unpaidRaw : payable
    const linkDefault = Math.max(0, unpaid)
    setRdLink({
      reconciliationId: id,
      statementNo: rec.settlementNumber != null ? String(rec.settlementNumber) : '',
      partner: rec.partner != null ? String(rec.partner) : '',
      game: rec.game != null ? String(rec.game) : '',
      payable: payable.toFixed(2),
      unpaid: (Number.isFinite(unpaid) ? unpaid : payable).toFixed(2),
      linkedAmount: linkDefault > 0 ? String(linkDefault) : payable > 0 ? String(payable) : ''
    })
  }

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
  }, [bankPaymentReconciliationPrefillId, records, setBankPaymentReconciliationPrefillId, showToast])

  const filteredRdRecords = useMemo(() => {
    const q = rdFilter.trim().toLowerCase()
    if (!q) return records
    return records.filter((r) => {
      const blob = [
        r.settlementNumber,
        r.partner,
        r.game,
        r.settlementMonth,
        r.id
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return blob.includes(q)
    })
  }, [records, rdFilter])

  const handleReset = () => {
    setForm(INITIAL)
    setPasteText('')
    setRdLink(INITIAL_RD)
    setRdFilter('')
    showToast('已清空表单', 'info')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const rid = rdLink.reconciliationId?.trim()
    let rdPayload = null
    if (rid) {
      const linked = parseFloat(String(rdLink.linkedAmount || '').replace(/,/g, ''))
      if (!Number.isFinite(linked) || linked <= 0) {
        showToast('请填写大于0 的本次关联金额', 'info')
        return
      }
      rdPayload = {
        reconciliation_id: rid,
        reconciliation_type: 'rd',
        reconciliation_no: rdLink.statementNo?.trim() || null,
        linked_amount: linked
      }
    }

    setSaving(true)
    try {
      const body = buildPaymentRegisterPayload(form, pasteText, rdPayload)
      await createBankTransaction(body)
      showToast('保存成功。已写入服务端。', 'success')
      handleReset()
      try {
        await refetchReconciliationFromApi?.()
      } catch {
        /* 忽略刷新失败 */
      }
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : '保存失败，请检查网络或后端配置', 'info')
    } finally {
      setSaving(false)
    }
  }

  const handleAutoFill = () => {
    try {
      const icbc = parseIcbcReceiptText(pasteText)
      if (icbc.recognized) {
        const patch = icbcToPaymentFormPatch(icbc)
        setForm((prev) => {
          const next = { ...prev }
          for (const [k, v] of Object.entries(patch)) {
            if (v === null || v === undefined) continue
            if (!(k in next)) continue
            next[k] = v
          }
          return next
        })
        showToast(`工行电子回单已解析，已填充 ${icbc.coreFieldCount} 项核心字段`, 'success')
        return
      }
      const { fields, matchedLines } = parseBankText(pasteText)
      if (matchedLines === 0) {
        showToast('未能识别有效字段行，请使用「字段名: 值」格式分行粘贴', 'info')
        return
      }
      setForm((prev) => {
        const next = { ...prev }
        for (const [k, v] of Object.entries(fields)) {
          if (v === null || v === undefined) continue
          if (typeof v === 'string' && v.trim() === '') continue
          if (!(k in next)) continue
          next[k] = v
        }
        return next
      })
      showToast(`已根据识别结果填充 ${matchedLines} 行字段`, 'success')
    } catch {
      showToast('解析时出现问题，请检查文本格式后重试', 'info')
    }
  }

  return (
    <PageContainer hideHeader className="page-container--admin-workspace">
      <div className="admin-workspace">
        <div className="admin-workspace__card">
          <p className="admin-workspace__card-desc" style={{ marginTop: 0 }}>
            付款单字段录入（与银行企业网银导出对照）；可粘贴工行回单等文本自动识别，保存后写入服务端「银行流水表」台账。
          </p>

          <div className="rec-bank-rd-link">
            <h3 className="rec-bank-rd-link__title">关联研发对账（可选）</h3>
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
                      return
                    }
                    const rec = records.find((r) => String(r.id) === String(v))
                    if (rec) applyFrontendRecordToRdLink(rec)
                  }}
                >
                  <option value="">不关联</option>
                  {filteredRdRecords.map((r) => (
                    <option key={String(r.id)} value={String(r.id)}>
                      {(r.settlementNumber || '无编号') +
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
                <input className="admin-input" readOnly value={rdLink.statementNo} placeholder="选择后自动带出" />
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
                未付金额（参考）
                <input className="admin-input" readOnly value={rdLink.unpaid} />
              </label>
              <label className="rec-bank-payment__field">
                本次关联金额
                <input
                  className="admin-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={rdLink.linkedAmount}
                  onChange={(e) => setRdLink((s) => ({ ...s, linkedAmount: e.target.value }))}
                  placeholder="关联研发对账时必填"
                  disabled={!rdLink.reconciliationId}
                />
              </label>
            </div>
          </div>

          <BankPasteAutoParseBlock
            pasteText={pasteText}
            onPasteTextChange={setPasteText}
            onAutoFill={handleAutoFill}
          />
          <form onSubmit={handleSubmit}>
            <section className="rec-bank-payment__section" style={{ marginBottom: 16 }}>
              <h3 className="rec-bank-payment__section-title">付款基础信息</h3>
              <div className="rec-bank-payment__grid">
                <label className="rec-bank-payment__field">
                  交易序号
                  <input className="admin-input" value={form.transaction_serial} onChange={set('transaction_serial')} />
                </label>
                <label className="rec-bank-payment__field">
                  授权状态
                  <input
                    className="admin-input"
                    value={form.authorization_status}
                    onChange={set('authorization_status')}
                  />
                </label>
                <label className="rec-bank-payment__field">
                  汇款金额
                  <input
                    className="admin-input"
                    type="number"
                    step="0.01"
                    value={form.remittance_amount}
                    onChange={set('remittance_amount')}
                  />
                </label>
                <label className="rec-bank-payment__field">
                  汇款方式选择
                  <input className="admin-input" value={form.remittance_method} onChange={set('remittance_method')} />
                </label>
                <label className="rec-bank-payment__field">
                  汇款用途
                  <input className="admin-input" value={form.remittance_purpose} onChange={set('remittance_purpose')} />
                </label>
                <label className="rec-bank-payment__field rec-bank-payment__field--full">
                  备注
                  <textarea className="admin-input" rows={2} value={form.payment_remark} onChange={set('payment_remark')} />
                </label>
                <label className="rec-bank-payment__field rec-bank-payment__check">
                  <input type="checkbox" checked={form.is_scheduled} onChange={set('is_scheduled')} />
                  <span>预约执行</span>
                </label>
                <label className="rec-bank-payment__field">
                  打款日期
                  <input className="admin-input" type="date" value={form.payment_date} onChange={set('payment_date')} />
                </label>
                <label className="rec-bank-payment__field">
                  打款状态
                  <select className="admin-input" value={form.transfer_status} onChange={set('transfer_status')}>
                    <option value="pending_submit">待提交</option>
                    <option value="submitted">已提交</option>
                    <option value="paid">已支付</option>
                    <option value="failed">已失败</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="rec-bank-payment__section" style={{ marginBottom: 16 }}>
              <h3 className="rec-bank-payment__section-title">付款方信息</h3>
              <div className="rec-bank-payment__grid">
                <label className="rec-bank-payment__field rec-bank-payment__field--full">
                  汇款单位
                  <input className="admin-input" value={form.remitter_company} onChange={set('remitter_company')} />
                </label>
                <label className="rec-bank-payment__field">
                  汇款账号
                  <input className="admin-input" value={form.remitter_account} onChange={set('remitter_account')} />
                </label>
                <label className="rec-bank-payment__field rec-bank-payment__field--full">
                  汇款单位开户行名称
                  <input className="admin-input" value={form.remitter_bank_name} onChange={set('remitter_bank_name')} />
                </label>
              </div>
            </section>

            <section className="rec-bank-payment__section" style={{ marginBottom: 16 }}>
              <h3 className="rec-bank-payment__section-title">收款方信息</h3>
              <div className="rec-bank-payment__grid">
                <label className="rec-bank-payment__field rec-bank-payment__field--full">
                  收款单位
                  <input className="admin-input" value={form.payee_company} onChange={set('payee_company')} />
                </label>
                <label className="rec-bank-payment__field">
                  收款账号
                  <input className="admin-input" value={form.payee_account} onChange={set('payee_account')} />
                </label>
                <label className="rec-bank-payment__field rec-bank-payment__field--full">
                  收款单位开户行名称
                  <input className="admin-input" value={form.payee_bank_name} onChange={set('payee_bank_name')} />
                </label>
              </div>
            </section>

            <section className="rec-bank-payment__section" style={{ marginBottom: 16 }}>
              <h3 className="rec-bank-payment__section-title">审批与银行反馈</h3>
              <div className="rec-bank-payment__grid">
                <label className="rec-bank-payment__field">
                  支付提交人 ID
                  <input className="admin-input" value={form.submitter_user_id} onChange={set('submitter_user_id')} />
                </label>
                <label className="rec-bank-payment__field">
                  第一授权人 ID
                  <input
                    className="admin-input"
                    value={form.first_approver_user_id}
                    onChange={set('first_approver_user_id')}
                  />
                </label>
                <label className="rec-bank-payment__field">
                  一次批复时间
                  <input
                    className="admin-input"
                    type="datetime-local"
                    value={form.first_approval_at}
                    onChange={set('first_approval_at')}
                  />
                </label>
                <label className="rec-bank-payment__field rec-bank-payment__field--full">
                  银行反馈信息
                  <textarea className="admin-input" rows={2} value={form.bank_feedback} onChange={set('bank_feedback')} />
                </label>
                <label className="rec-bank-payment__field">
                  指令受理渠道
                  <input className="admin-input" value={form.instruction_channel} onChange={set('instruction_channel')} />
                </label>
                <label className="rec-bank-payment__field rec-bank-payment__check">
                  <input type="checkbox" checked={form.is_personal_payee} onChange={set('is_personal_payee')} />
                  <span>是否向个人账户汇款</span>
                </label>
              </div>
            </section>

            <div className="rec-bank-payment__footer-actions" style={{ marginTop: 16 }}>
              <button type="button" className="rec-btn rec-btn--ghost" onClick={handleReset}>
                清空
              </button>
              <button type="submit" className="rec-btn rec-btn--primary" disabled={saving}>
                {saving ? '提交中…' : '提交保存'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageContainer>
  )
}

export default BankPaymentRegisterPage
