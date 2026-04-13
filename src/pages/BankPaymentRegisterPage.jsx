import React, { useState } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import PageContainer from '@/components/layout/PageContainer.jsx'
import BankPasteAutoParseBlock from '@/components/bank/BankPasteAutoParseBlock.jsx'
import { parseBankText } from '@/utils/parseBankText.js'
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

function BankPaymentRegisterPage() {
  const { showToast } = useAppState()
  const [form, setForm] = useState(INITIAL)
  const [pasteText, setPasteText] = useState('')

  const set =
    (key) =>
    (e) => {
      const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
      setForm((f) => ({ ...f, [key]: v }))
    }

  const handleReset = () => {
    setForm(INITIAL)
    setPasteText('')
    showToast('已清空表单', 'info')
  }

  const handleSaveDraft = (e) => {
    e.preventDefault()
    showToast('已保存为本地草稿（本轮仅前端占位，未写入服务端）', 'success')
  }

  const handleAutoFill = () => {
    try {
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
            付款单字段录入（与银行企业网银导出对照）；可粘贴文本自动识别，当前不落库。
          </p>
          <BankPasteAutoParseBlock
            pasteText={pasteText}
            onPasteTextChange={setPasteText}
            onAutoFill={handleAutoFill}
          />
          <form onSubmit={handleSaveDraft}>
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
              <button type="submit" className="rec-btn rec-btn--primary">
                保存草稿（本地）
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageContainer>
  )
}

export default BankPaymentRegisterPage
