import React, { useCallback, useEffect, useState } from 'react'
import PageContainer from '@/components/layout/PageContainer.jsx'
import { useAppState } from '@/app/AppStateContext.jsx'
import { ApiError } from '@/lib/api/client.ts'
import {
  createBankTransaction,
  deleteBankTransaction,
  getBankTransactionDetail,
  getBankTransactions,
  updateBankTransaction
} from '@/lib/api/bankTransaction.ts'
import '@/components/reconciliation/reconciliation-admin.css'

const TYPE_LABELS = {
  statement_import: '流水导入',
  payment_register: '付款登记',
  collection_register: '回款登记'
}

const EMPTY_EDIT = {
  type: 'statement_import',
  trade_date: '',
  bank_account: '',
  payer_name: '',
  payer_account: '',
  payer_bank_name: '',
  payee_name: '',
  payee_account: '',
  payee_bank_name: '',
  amount: '',
  income_amount: '',
  expense_amount: '',
  currency: 'CNY',
  transaction_no: '',
  instruction_no: '',
  summary: '',
  purpose: '',
  remark: '',
  status: '',
  raw_text: '',
  attachment_url: ''
}

function fmtMoney(v) {
  if (v == null || v === '') return '—'
  const n = Number(v)
  if (!Number.isFinite(n)) return String(v)
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function fmtDt(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString('zh-CN', { hour12: false })
  } catch {
    return iso
  }
}

function rowPartyLabel(row) {
  const self = row.bank_account || '—'
  const other = row.payer_name || row.payee_name || '—'
  return `${self} / ${other}`
}

function mapRowToEditForm(row) {
  return {
    type: row.type || 'statement_import',
    trade_date: row.trade_date || '',
    bank_account: row.bank_account || '',
    payer_name: row.payer_name || '',
    payer_account: row.payer_account || '',
    payer_bank_name: row.payer_bank_name || '',
    payee_name: row.payee_name || '',
    payee_account: row.payee_account || '',
    payee_bank_name: row.payee_bank_name || '',
    amount: row.amount != null ? String(row.amount) : '',
    income_amount: row.income_amount != null ? String(row.income_amount) : '',
    expense_amount: row.expense_amount != null ? String(row.expense_amount) : '',
    currency: row.currency || 'CNY',
    transaction_no: row.transaction_no || '',
    instruction_no: row.instruction_no || '',
    summary: row.summary || '',
    purpose: row.purpose || '',
    remark: row.remark || '',
    status: row.status || '',
    raw_text: row.raw_text || '',
    attachment_url: row.attachment_url || ''
  }
}

export default function BankTransactionsLedgerPage() {
  const { showToast } = useAppState()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')

  const [modal, setModal] = useState({ open: false, mode: 'view', id: null })
  const [editForm, setEditForm] = useState(EMPTY_EDIT)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getBankTransactions({
        q: q.trim() || undefined,
        type: typeFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        amount_min: amountMin || undefined,
        amount_max: amountMax || undefined,
        limit: 100,
        offset: 0
      })
      setItems(res.items)
      setTotal(res.total)
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : '加载失败'
      showToast(msg, 'info')
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [amountMax, amountMin, dateFrom, dateTo, q, showToast, typeFilter])

  useEffect(() => {
    load()
  }, [load])

  const openView = async (id) => {
    try {
      const row = await getBankTransactionDetail(id)
      setEditForm(mapRowToEditForm(row))
      setModal({ open: true, mode: 'view', id })
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : '加载详情失败', 'info')
    }
  }

  const openEdit = async (id) => {
    try {
      const row = await getBankTransactionDetail(id)
      setEditForm(mapRowToEditForm(row))
      setModal({ open: true, mode: 'edit', id })
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : '加载详情失败', 'info')
    }
  }

  const closeModal = () => {
    setModal({ open: false, mode: 'view', id: null })
    setEditForm(EMPTY_EDIT)
  }

  const setField = (key) => (e) => {
    const v = e.target.value
    setEditForm((f) => ({ ...f, [key]: v }))
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (modal.mode !== 'edit') return
    if (!modal.id) return
    setSaving(true)
    try {
      const toNum = (s) => {
        if (s === '' || s == null) return null
        const n = Number(s)
        return Number.isFinite(n) ? n : null
      }
      const body = {
        type: editForm.type,
        trade_date: editForm.trade_date || null,
        bank_account: editForm.bank_account || null,
        payer_name: editForm.payer_name || null,
        payer_account: editForm.payer_account || null,
        payer_bank_name: editForm.payer_bank_name || null,
        payee_name: editForm.payee_name || null,
        payee_account: editForm.payee_account || null,
        payee_bank_name: editForm.payee_bank_name || null,
        amount: toNum(editForm.amount),
        income_amount: toNum(editForm.income_amount),
        expense_amount: toNum(editForm.expense_amount),
        currency: editForm.currency || 'CNY',
        transaction_no: editForm.transaction_no || null,
        instruction_no: editForm.instruction_no || null,
        summary: editForm.summary || null,
        purpose: editForm.purpose || null,
        remark: editForm.remark || null,
        status: editForm.status || null,
        raw_text: editForm.raw_text || null,
        attachment_url: editForm.attachment_url || null
      }
      await updateBankTransaction(modal.id, body)
      showToast('保存成功。已写入服务端。', 'success')
      closeModal()
      load()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : '保存失败', 'info')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除该条银行流水记录？此操作不可恢复。')) return
    try {
      await deleteBankTransaction(id)
      showToast('已删除', 'success')
      load()
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : '删除失败', 'info')
    }
  }

  const handleCreateBlank = async () => {
    try {
      await createBankTransaction({
        type: 'statement_import',
        trade_date: null,
        bank_account: null,
        payer_name: null,
        payer_account: null,
        payer_bank_name: null,
        payee_name: null,
        payee_account: null,
        payee_bank_name: null,
        amount: null,
        income_amount: null,
        expense_amount: null,
        currency: 'CNY',
        transaction_no: null,
        instruction_no: null,
        summary: null,
        purpose: null,
        remark: null,
        status: 'draft',
        raw_text: null,
        attachment_url: null
      })
      showToast('保存成功。已写入服务端。', 'success')
      load()
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : '新增失败', 'info')
    }
  }

  return (
    <PageContainer hideHeader className="page-container--admin-workspace">
      <div className="admin-workspace">
        <div className="admin-workspace__card">
          <p className="admin-workspace__card-desc" style={{ marginTop: 0 }}>
            统一展示流水导入、付款登记、回款登记写入的记录；支持筛选与维护。
          </p>

          <div
            className="rec-bank-payment__grid"
            style={{ marginBottom: 16, alignItems: 'end' }}
          >
            <label className="rec-bank-payment__field rec-bank-payment__field--full">
              搜索
              <input
                className="admin-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="户名、账号、流水号、备注…"
              />
            </label>
            <label className="rec-bank-payment__field">
              类型
              <select
                className="admin-input"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">全部</option>
                <option value="statement_import">流水导入</option>
                <option value="payment_register">付款登记</option>
                <option value="collection_register">回款登记</option>
              </select>
            </label>
            <label className="rec-bank-payment__field">
              交易日起
              <input
                className="admin-input"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </label>
            <label className="rec-bank-payment__field">
              交易日止
              <input
                className="admin-input"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </label>
            <label className="rec-bank-payment__field">
              金额下限
              <input
                className="admin-input"
                value={amountMin}
                onChange={(e) => setAmountMin(e.target.value)}
                placeholder="如 100"
              />
            </label>
            <label className="rec-bank-payment__field">
              金额上限
              <input
                className="admin-input"
                value={amountMax}
                onChange={(e) => setAmountMax(e.target.value)}
              />
            </label>
            <div className="rec-bank-payment__footer-actions" style={{ marginTop: 0 }}>
              <button type="button" className="rec-btn rec-btn--primary" onClick={load} disabled={loading}>
                {loading ? '查询中…' : '查询'}
              </button>
              <button type="button" className="rec-btn rec-btn--secondary" onClick={handleCreateBlank}>
                快速新增空记录
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table--compact" style={{ width: '100%', minWidth: 1100 }}>
              <thead>
                <tr>
                  <th>类型</th>
                  <th>交易日期</th>
                  <th>本方账户 / 对方名称</th>
                  <th>金额</th>
                  <th>收入</th>
                  <th>支出</th>
                  <th>流水号</th>
                  <th>指令编号</th>
                  <th>银行账户</th>
                  <th>状态</th>
                  <th>备注</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={13} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
                      {loading ? '加载中…' : '暂无数据'}
                    </td>
                  </tr>
                ) : (
                  items.map((row) => (
                    <tr key={row.id}>
                      <td>{TYPE_LABELS[row.type] || row.type}</td>
                      <td>{row.trade_date || '—'}</td>
                      <td style={{ maxWidth: 220, wordBreak: 'break-word' }}>{rowPartyLabel(row)}</td>
                      <td>{fmtMoney(row.amount)}</td>
                      <td>{fmtMoney(row.income_amount)}</td>
                      <td>{fmtMoney(row.expense_amount)}</td>
                      <td style={{ maxWidth: 120, wordBreak: 'break-all' }}>{row.transaction_no || '—'}</td>
                      <td style={{ maxWidth: 100, wordBreak: 'break-all' }}>{row.instruction_no || '—'}</td>
                      <td style={{ maxWidth: 140, wordBreak: 'break-all' }}>{row.bank_account || '—'}</td>
                      <td>{row.status || '—'}</td>
                      <td style={{ maxWidth: 160, wordBreak: 'break-word' }} title={row.remark || ''}>
                        {row.remark ? (row.remark.length > 40 ? `${row.remark.slice(0, 40)}…` : row.remark) : '—'}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{fmtDt(row.created_at)}</td>
                      <td>
                        <div className="rec-bank-payment__footer-actions" style={{ marginTop: 0, gap: 6 }}>
                          <button
                            type="button"
                            className="rec-btn rec-btn--ghost"
                            style={{ padding: '4px 8px', fontSize: 12 }}
                            onClick={() => openView(row.id)}
                          >
                            详情
                          </button>
                          <button
                            type="button"
                            className="rec-btn rec-btn--secondary"
                            style={{ padding: '4px 8px', fontSize: 12 }}
                            onClick={() => openEdit(row.id)}
                          >
                            编辑
                          </button>
                          <button
                            type="button"
                            className="rec-btn rec-btn--ghost"
                            style={{ padding: '4px 8px', fontSize: 12 }}
                            onClick={() => handleDelete(row.id)}
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: 8, fontSize: 13, color: 'var(--admin-text-sub, #64748b)' }}>
            共 {total} 条（本页最多 100 条，可改筛选条件后查询）
          </p>
        </div>
      </div>

      {modal.open ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.45)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={closeModal}
        >
          <div
            className="admin-workspace__card"
            style={{ maxWidth: 720, width: '100%', maxHeight: '90vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>{modal.mode === 'edit' ? '编辑银行流水' : '银行流水详情'}</h3>
            <form
              onSubmit={(ev) => {
                ev.preventDefault()
                if (modal.mode === 'edit') handleSaveEdit(ev)
              }}
            >
              <div className="rec-bank-payment__grid">
                <label className="rec-bank-payment__field">
                  记录类型
                  <select
                    className="admin-input"
                    value={editForm.type}
                    onChange={setField('type')}
                    disabled={modal.mode === 'view'}
                  >
                    <option value="statement_import">流水导入</option>
                    <option value="payment_register">付款登记</option>
                    <option value="collection_register">回款登记</option>
                  </select>
                </label>
                <label className="rec-bank-payment__field">
                  交易日期
                  <input
                    className="admin-input"
                    type="date"
                    value={editForm.trade_date}
                    onChange={setField('trade_date')}
                    disabled={modal.mode === 'view'}
                  />
                </label>
                <label className="rec-bank-payment__field rec-bank-payment__field--full">
                  银行账户（本方）
                  <input
                    className="admin-input"
                    value={editForm.bank_account}
                    onChange={setField('bank_account')}
                    disabled={modal.mode === 'view'}
                  />
                </label>
                <label className="rec-bank-payment__field rec-bank-payment__field--full">
                  付款方名称
                  <input
                    className="admin-input"
                    value={editForm.payer_name}
                    onChange={setField('payer_name')}
                    disabled={modal.mode === 'view'}
                  />
                </label>
                <label className="rec-bank-payment__field">
                  付款方账号
                  <input
                    className="admin-input"
                    value={editForm.payer_account}
                    onChange={setField('payer_account')}
                    disabled={modal.mode === 'view'}
                  />
                </label>
                <label className="rec-bank-payment__field rec-bank-payment__field--full">
                  付款方开户行
                  <input
                    className="admin-input"
                    value={editForm.payer_bank_name}
                    onChange={setField('payer_bank_name')}
                    disabled={modal.mode === 'view'}
                  />
                </label>
                <label className="rec-bank-payment__field rec-bank-payment__field--full">
                  收款方名称
                  <input
                    className="admin-input"
                    value={editForm.payee_name}
                    onChange={setField('payee_name')}
                    disabled={modal.mode === 'view'}
                  />
                </label>
                <label className="rec-bank-payment__field">
                  收款方账号
                  <input
                    className="admin-input"
                    value={editForm.payee_account}
                    onChange={setField('payee_account')}
                    disabled={modal.mode === 'view'}
                  />
                </label>
                <label className="rec-bank-payment__field rec-bank-payment__field--full">
                  收款方开户行
                  <input
                    className="admin-input"
                    value={editForm.payee_bank_name}
                    onChange={setField('payee_bank_name')}
                    disabled={modal.mode === 'view'}
                  />
                </label>
                <label className="rec-bank-payment__field">
                  金额
                  <input
                    className="admin-input"
                    value={editForm.amount}
                    onChange={setField('amount')}
                    disabled={modal.mode === 'view'}
                  />
                </label>
                <label className="rec-bank-payment__field">
                  收入金额
                  <input
                    className="admin-input"
                    value={editForm.income_amount}
                    onChange={setField('income_amount')}
                    disabled={modal.mode === 'view'}
                  />
                </label>
                <label className="rec-bank-payment__field">
                  支出金额
                  <input
                    className="admin-input"
                    value={editForm.expense_amount}
                    onChange={setField('expense_amount')}
                    disabled={modal.mode === 'view'}
                  />
                </label>
                <label className="rec-bank-payment__field">
                  币种
                  <input
                    className="admin-input"
                    value={editForm.currency}
                    onChange={setField('currency')}
                    disabled={modal.mode === 'view'}
                  />
                </label>
                <label className="rec-bank-payment__field">
                  交易流水号
                  <input
                    className="admin-input"
                    value={editForm.transaction_no}
                    onChange={setField('transaction_no')}
                    disabled={modal.mode === 'view'}
                  />
                </label>
                <label className="rec-bank-payment__field">
                  指令编号
                  <input
                    className="admin-input"
                    value={editForm.instruction_no}
                    onChange={setField('instruction_no')}
                    disabled={modal.mode === 'view'}
                  />
                </label>
                <label className="rec-bank-payment__field rec-bank-payment__field--full">
                  摘要
                  <input
                    className="admin-input"
                    value={editForm.summary}
                    onChange={setField('summary')}
                    disabled={modal.mode === 'view'}
                  />
                </label>
                <label className="rec-bank-payment__field rec-bank-payment__field--full">
                  用途
                  <input
                    className="admin-input"
                    value={editForm.purpose}
                    onChange={setField('purpose')}
                    disabled={modal.mode === 'view'}
                  />
                </label>
                <label className="rec-bank-payment__field">
                  状态
                  <input
                    className="admin-input"
                    value={editForm.status}
                    onChange={setField('status')}
                    disabled={modal.mode === 'view'}
                  />
                </label>
                <label className="rec-bank-payment__field rec-bank-payment__field--full">
                  附件 URL
                  <input
                    className="admin-input"
                    value={editForm.attachment_url}
                    onChange={setField('attachment_url')}
                    disabled={modal.mode === 'view'}
                  />
                </label>
                <label className="rec-bank-payment__field rec-bank-payment__field--full">
                  备注
                  <textarea
                    className="admin-input"
                    rows={2}
                    value={editForm.remark}
                    onChange={setField('remark')}
                    disabled={modal.mode === 'view'}
                  />
                </label>
                <label className="rec-bank-payment__field rec-bank-payment__field--full">
                  原始粘贴文本
                  <textarea
                    className="admin-input"
                    rows={4}
                    value={editForm.raw_text}
                    onChange={setField('raw_text')}
                    disabled={modal.mode === 'view'}
                  />
                </label>
              </div>
              <div className="rec-bank-payment__footer-actions" style={{ marginTop: 16 }}>
                <button type="button" className="rec-btn rec-btn--ghost" onClick={closeModal}>
                  关闭
                </button>
                {modal.mode === 'edit' ? (
                  <button type="submit" className="rec-btn rec-btn--primary" disabled={saving}>
                    {saving ? '保存中…' : '保存'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rec-btn rec-btn--primary"
                    onClick={() => setModal((m) => ({ ...m, mode: 'edit' }))}
                  >
                    改为编辑
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </PageContainer>
  )
}
