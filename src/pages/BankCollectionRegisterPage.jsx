import React, { useState } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import PageContainer from '@/components/layout/PageContainer.jsx'
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

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleReset = () => {
    setForm(INITIAL)
    setAttachmentName('')
    showToast('已清空表单', 'info')
  }

  const handleAttachment = (e) => {
    const f = e.target.files?.[0]
    setAttachmentName(f ? f.name : '')
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
            登记银行回款信息；附件仅本地选择展示文件名，上传与认领匹配后续再接 API。
          </p>
          <form onSubmit={handleSaveDraft}>
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

export default BankCollectionRegisterPage
