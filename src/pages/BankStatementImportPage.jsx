import React, { useState } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import PageContainer from '@/components/layout/PageContainer.jsx'
import BankPasteAutoParseBlock from '@/components/bank/BankPasteAutoParseBlock.jsx'
import { parseBankText } from '@/utils/parseBankText.js'
import '@/components/reconciliation/reconciliation-admin.css'

const INITIAL = {
  tradeDate: '',
  bankAccount: '',
  counterpartyName: '',
  counterpartyAccount: '',
  summary: '',
  incomeAmount: '',
  expenseAmount: '',
  balance: '',
  serialNo: '',
  remark: ''
}

function BankStatementImportPage() {
  const { showToast } = useAppState()
  const [form, setForm] = useState(INITIAL)
  const [pasteText, setPasteText] = useState('')

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleReset = () => {
    setForm(INITIAL)
    setPasteText('')
    showToast('已清空表单', 'info')
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
        const assign = (key, val) => {
          if (val === null || val === undefined) return
          const s = typeof val === 'string' ? val.trim() : val
          if (s === '') return
          if (key in next) next[key] = typeof val === 'boolean' ? val : String(s)
        }
        assign('tradeDate', fields.tradeDate)
        assign('bankAccount', fields.bankAccount)
        assign('counterpartyName', fields.counterpartyName)
        assign('counterpartyAccount', fields.counterpartyAccount)
        assign('summary', fields.summary)
        assign('incomeAmount', fields.incomeAmount)
        assign('expenseAmount', fields.expenseAmount)
        assign('balance', fields.balance)
        const serial =
          fields.statement_serial_no || fields.bank_reference_no || fields.transaction_serial
        assign('serialNo', serial)
        if (fields.payment_remark) assign('remark', fields.payment_remark)
        return next
      })
      showToast(`已根据识别结果填充（共 ${matchedLines} 行有效映射）`, 'success')
    } catch {
      showToast('解析时出现问题，请检查文本格式后重试', 'info')
    }
  }

  const handleSaveDraft = (e) => {
    e.preventDefault()
    showToast('已保存为本地草稿（本轮仅前端占位，未写入服务端）', 'success')
  }

  return (
    <PageContainer hideHeader className="page-container--admin-workspace">
      <div className="admin-workspace">
        <div className="admin-workspace__card">
          <p className="admin-workspace__card-desc" style={{ marginTop: 0 }}>
            录入或粘贴单条流水字段，后续可扩展 Excel 导入与自动匹配；当前不落库。
          </p>
          <BankPasteAutoParseBlock
            pasteText={pasteText}
            onPasteTextChange={setPasteText}
            onAutoFill={handleAutoFill}
          />
          <form onSubmit={handleSaveDraft}>
            <div className="rec-bank-payment__grid">
              <label className="rec-bank-payment__field">
                交易日期
                <input
                  className="admin-input"
                  type="date"
                  value={form.tradeDate}
                  onChange={set('tradeDate')}
                />
              </label>
              <label className="rec-bank-payment__field">
                银行账户
                <input
                  className="admin-input"
                  type="text"
                  value={form.bankAccount}
                  onChange={set('bankAccount')}
                  placeholder="本方账户"
                />
              </label>
              <label className="rec-bank-payment__field">
                对方户名
                <input
                  className="admin-input"
                  type="text"
                  value={form.counterpartyName}
                  onChange={set('counterpartyName')}
                />
              </label>
              <label className="rec-bank-payment__field">
                对方账号
                <input
                  className="admin-input"
                  type="text"
                  value={form.counterpartyAccount}
                  onChange={set('counterpartyAccount')}
                />
              </label>
              <label className="rec-bank-payment__field rec-bank-payment__field--full">
                摘要 / 用途
                <input
                  className="admin-input"
                  type="text"
                  value={form.summary}
                  onChange={set('summary')}
                />
              </label>
              <label className="rec-bank-payment__field">
                收入金额
                <input
                  className="admin-input"
                  type="number"
                  step="0.01"
                  value={form.incomeAmount}
                  onChange={set('incomeAmount')}
                />
              </label>
              <label className="rec-bank-payment__field">
                支出金额
                <input
                  className="admin-input"
                  type="number"
                  step="0.01"
                  value={form.expenseAmount}
                  onChange={set('expenseAmount')}
                />
              </label>
              <label className="rec-bank-payment__field">
                余额
                <input
                  className="admin-input"
                  type="number"
                  step="0.01"
                  value={form.balance}
                  onChange={set('balance')}
                />
              </label>
              <label className="rec-bank-payment__field">
                流水号
                <input
                  className="admin-input"
                  type="text"
                  value={form.serialNo}
                  onChange={set('serialNo')}
                />
              </label>
              <label className="rec-bank-payment__field rec-bank-payment__field--full">
                备注
                <textarea
                  className="admin-input"
                  rows={2}
                  value={form.remark}
                  onChange={set('remark')}
                />
              </label>
            </div>
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

export default BankStatementImportPage
