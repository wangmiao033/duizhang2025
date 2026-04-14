import React, { useState } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import PageContainer from '@/components/layout/PageContainer.jsx'
import BankPasteAutoParseBlock from '@/components/bank/BankPasteAutoParseBlock.jsx'
import { ApiError } from '@/lib/api/client.ts'
import { createBankTransaction } from '@/lib/api/bankTransaction.ts'
import { buildCollectionRegisterPayload } from '@/lib/bank/bankTransactionPayloads.js'
import { looksLikePaymentSlipFields, parseBankText } from '@/utils/parseBankText.js'
import { icbcToCollectionFormPatch, parseIcbcReceiptText } from '@/utils/parseIcbcReceipt.js'
import '@/components/reconciliation/reconciliation-admin.css'

const CLAIM_OPTIONS = ['未认领', '部分认领', '已认领']

const INITIAL = {
  collectionDate: '',
  collectionAccount: '',
  channelProjectGame: '',
  amount: '',
  currency: 'CNY',
  payerName: '',
  bankSerialNo: '',
  claimStatus: CLAIM_OPTIONS[0],
  remark: ''
}

function BankCollectionRegisterPage() {
  const { showToast } = useAppState()
  const [form, setForm] = useState(INITIAL)
  const [attachmentName, setAttachmentName] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleReset = () => {
    setForm(INITIAL)
    setAttachmentName('')
    setPasteText('')
    showToast('已清空表单', 'info')
  }

  const handleAutoFill = () => {
    try {
      const icbc = parseIcbcReceiptText(pasteText)
      if (icbc.recognized) {
        const patch = icbcToCollectionFormPatch(icbc)
        setForm((prev) => {
          const next = { ...prev }
          const { remark: patchRemark, ...rest } = patch
          for (const [k, v] of Object.entries(rest)) {
            if (v == null || String(v).trim() === '') continue
            if (k in next) next[k] = String(v).trim()
          }
          if (patchRemark && String(patchRemark).trim()) {
            next.remark = [prev.remark, patchRemark].filter(Boolean).join('\n').trim()
          }
          return next
        })
        showToast('已按付款回单解析，仅填充金额/对方/流水/日期/备注等共用字段', 'success')
        return
      }
      const { fields, matchedLines } = parseBankText(pasteText)
      if (matchedLines === 0) {
        showToast('未能识别有效字段行，请使用「字段名: 值」格式分行粘贴', 'info')
        return
      }
      if (looksLikePaymentSlipFields(fields)) {
        showToast('当前内容更像银行付款单，已在回款页跳过自动填充，请改用「研发对账付款确认」', 'info')
        return
      }
      setForm((prev) => {
        const next = { ...prev }
        const assign = (key, val) => {
          if (val === null || val === undefined) return
          const s = typeof val === 'string' ? val.trim() : val
          if (s === '') return
          if (key in next) next[key] = String(s)
        }
        assign('collectionDate', fields.collectionDate || fields.tradeDate)
        assign('collectionAccount', fields.collectionAccount || fields.bankAccount)
        assign('amount', fields.collection_amount)
        assign('currency', fields.currency)
        assign('payerName', fields.payerName || fields.counterpartyName)
        const serial =
          fields.bank_reference_no || fields.statement_serial_no || fields.transaction_serial
        assign('bankSerialNo', serial)
        if (fields.payment_remark) assign('remark', fields.payment_remark)
        assign('channelProjectGame', fields.channelProjectGame)
        if (fields.claimStatus && CLAIM_OPTIONS.includes(fields.claimStatus)) {
          next.claimStatus = fields.claimStatus
        }
        return next
      })
      showToast(`已填充回款相关字段（识别 ${matchedLines} 行）`, 'success')
    } catch {
      showToast('解析时出现问题，请检查文本格式后重试', 'info')
    }
  }

  const handleAttachment = (e) => {
    const f = e.target.files?.[0]
    setAttachmentName(f ? f.name : '')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = buildCollectionRegisterPayload(form, pasteText)
      await createBankTransaction(body)
      showToast('保存成功。已写入服务端。', 'success')
      handleReset()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : '保存失败，请检查网络或后端配置', 'info')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageContainer hideHeader className="page-container--admin-workspace">
      <div className="admin-workspace">
        <div className="admin-workspace__card">
          <p className="admin-workspace__card-desc" style={{ marginTop: 0 }}>
            登记银行回款信息；保存后写入服务端「银行流水表」。附件仍为本地选择（文件名仅作备忘，上传能力可后续再接）。
          </p>
          <BankPasteAutoParseBlock
            pasteText={pasteText}
            onPasteTextChange={setPasteText}
            onAutoFill={handleAutoFill}
          />
          <form onSubmit={handleSubmit}>
            <div className="rec-bank-payment__grid">
              <label className="rec-bank-payment__field">
                回款日期
                <input
                  className="admin-input"
                  type="date"
                  value={form.collectionDate}
                  onChange={set('collectionDate')}
                />
              </label>
              <label className="rec-bank-payment__field">
                回款账户
                <input
                  className="admin-input"
                  type="text"
                  value={form.collectionAccount}
                  onChange={set('collectionAccount')}
                  placeholder="收款账户"
                />
              </label>
              <label className="rec-bank-payment__field rec-bank-payment__field--full">
                对应渠道 / 项目 / 游戏
                <input
                  className="admin-input"
                  type="text"
                  value={form.channelProjectGame}
                  onChange={set('channelProjectGame')}
                />
              </label>
              <label className="rec-bank-payment__field">
                回款金额
                <input
                  className="admin-input"
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={set('amount')}
                />
              </label>
              <label className="rec-bank-payment__field">
                币种
                <input
                  className="admin-input"
                  type="text"
                  value={form.currency}
                  onChange={set('currency')}
                />
              </label>
              <label className="rec-bank-payment__field">
                打款方
                <input
                  className="admin-input"
                  type="text"
                  value={form.payerName}
                  onChange={set('payerName')}
                />
              </label>
              <label className="rec-bank-payment__field">
                银行流水号
                <input
                  className="admin-input"
                  type="text"
                  value={form.bankSerialNo}
                  onChange={set('bankSerialNo')}
                />
              </label>
              <label className="rec-bank-payment__field">
                认领状态
                <select
                  className="admin-input"
                  value={form.claimStatus}
                  onChange={set('claimStatus')}
                >
                  {CLAIM_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
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
              <label className="rec-bank-payment__field rec-bank-payment__field--full">
                附件
                <input
                  className="admin-input"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={handleAttachment}
                />
                {attachmentName ? (
                  <span style={{ color: 'var(--admin-text-sub, #64748b)' }}>已选：{attachmentName}</span>
                ) : null}
              </label>
            </div>
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

export default BankCollectionRegisterPage
