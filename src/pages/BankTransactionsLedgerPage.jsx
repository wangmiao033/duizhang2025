import React, { useCallback, useEffect, useState } from 'react'
import PageContainer from '@/components/layout/PageContainer.jsx'
import { useAppState } from '@/app/AppStateContext.jsx'
import { API_BASE_URL, ApiError } from '@/lib/api/client.ts'
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

const NA = '暂无'

const STATUS_TAG = {
  paid: { label: '已付款', cls: 'bank-ledger-tag--success' },
  pending: { label: '待处理', cls: 'bank-ledger-tag--warn' },
  draft: { label: '草稿', cls: 'bank-ledger-tag--muted' },
  matched: { label: '已匹配', cls: 'bank-ledger-tag--info' },
  unmatched: { label: '未匹配', cls: 'bank-ledger-tag--danger' }
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
  attachment_url: '',
  created_at: ''
}

function fmtMoneyVal(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  if (!Number.isFinite(n)) return String(v)
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function fmtYuan(v) {
  const s = fmtMoneyVal(v)
  return s == null ? NA : `¥${s}`
}

function fmtDtShort(iso) {
  if (!iso) return NA
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString('zh-CN', { hour12: false })
  } catch {
    return iso
  }
}

function formatBankLine(bankName, account) {
  const parts = []
  if (bankName) parts.push(bankName)
  if (account && String(account).length >= 4) parts.push(`尾号 ${String(account).slice(-4)}`)
  else if (account) parts.push(String(account))
  return parts.length ? parts.join(' ') : null
}

function buildCounterpartyPrimary(row) {
  if (row.type === 'payment_register') {
    const name = row.payee_name?.trim()
    return name ? `付款给 ${name}` : NA
  }
  if (row.type === 'collection_register') {
    const name = row.payer_name?.trim()
    return name ? `来自 ${name}` : NA
  }
  const p = row.payer_name?.trim()
  const q = row.payee_name?.trim()
  if (p && q) return `${p} → ${q}`
  if (p || q) return p || q
  return NA
}

function buildCounterpartySub(row) {
  if (row.type === 'payment_register') {
    return formatBankLine(row.payee_bank_name, row.payee_account)
  }
  if (row.type === 'collection_register') {
    return formatBankLine(row.payer_bank_name, row.payer_account)
  }
  const bits = []
  if (row.bank_account?.trim()) bits.push(`本方 ${row.bank_account.trim()}`)
  if (row.payer_account?.trim()) bits.push(`付方账号 ${row.payer_account.trim()}`)
  if (row.payee_account?.trim()) bits.push(`收方账号 ${row.payee_account.trim()}`)
  return bits.length ? bits.join(' · ') : null
}

function buildAmountDisplay(row) {
  if (row.type === 'payment_register') {
    const v = row.expense_amount ?? row.amount
    return { main: fmtYuan(v), sub: '支出' }
  }
  if (row.type === 'collection_register') {
    const v = row.income_amount ?? row.amount
    return { main: fmtYuan(v), sub: '收入' }
  }
  const inc = Number(row.income_amount)
  const exp = Number(row.expense_amount)
  if (Number.isFinite(exp) && exp > 0) return { main: fmtYuan(row.expense_amount ?? row.amount), sub: '支出' }
  if (Number.isFinite(inc) && inc > 0) return { main: fmtYuan(row.income_amount ?? row.amount), sub: '收入' }
  return { main: fmtYuan(row.amount), sub: '金额' }
}

function buildBizLines(row) {
  const lines = []
  if (row.transaction_no?.trim()) lines.push({ t: '流水号', v: row.transaction_no.trim() })
  if (row.instruction_no?.trim()) lines.push({ t: '指令编号', v: row.instruction_no.trim() })
  if (row.bank_account?.trim()) lines.push({ t: '银行账户', v: row.bank_account.trim() })
  return lines
}

function statusTagMeta(raw) {
  const key = (raw || '').trim().toLowerCase()
  if (STATUS_TAG[key]) return STATUS_TAG[key]
  if (!raw) return { label: NA, cls: 'bank-ledger-tag--muted' }
  return { label: raw, cls: 'bank-ledger-tag--muted' }
}

function StatusTag({ status }) {
  const { label, cls } = statusTagMeta(status)
  return <span className={`bank-ledger-tag ${cls}`}>{label}</span>
}

function attachmentHref(url) {
  if (!url?.trim()) return ''
  const u = url.trim()
  if (u.startsWith('http')) return u
  return `${API_BASE_URL}${u.startsWith('/') ? u : `/${u}`}`
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
    attachment_url: row.attachment_url || '',
    created_at: row.created_at || ''
  }
}

function DetailSection({ title, children }) {
  return (
    <div className="bank-ledger-detail__section">
      <h4 className="bank-ledger-detail__section-title">{title}</h4>
      <div className="bank-ledger-detail__section-body">{children}</div>
    </div>
  )
}

function DetailKV({ label, value }) {
  const display = value == null || value === '' ? NA : value
  return (
    <div className="bank-ledger-detail__kv">
      <span className="bank-ledger-detail__k">{label}</span>
      <span className="bank-ledger-detail__v">{display}</span>
    </div>
  )
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
  const [actionMenuId, setActionMenuId] = useState(null)

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

  useEffect(() => {
    if (!actionMenuId) return
    const close = () => setActionMenuId(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [actionMenuId])

  const openView = async (id) => {
    setActionMenuId(null)
    try {
      const row = await getBankTransactionDetail(id)
      setEditForm(mapRowToEditForm(row))
      setModal({ open: true, mode: 'view', id })
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : '加载详情失败', 'info')
    }
  }

  const openEdit = async (id) => {
    setActionMenuId(null)
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
      if (modal.id === id) closeModal()
      setActionMenuId(null)
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

  const renderViewBody = () => (
    <>
      <DetailSection title="基本信息">
        <DetailKV label="类型" value={TYPE_LABELS[editForm.type] || editForm.type || NA} />
        <DetailKV label="交易日期" value={editForm.trade_date || NA} />
        <div className="bank-ledger-detail__kv">
          <span className="bank-ledger-detail__k">状态</span>
          <span className="bank-ledger-detail__v">
            <StatusTag status={editForm.status} />
          </span>
        </div>
        <DetailKV label="创建时间" value={fmtDtShort(editForm.created_at)} />
      </DetailSection>
      <DetailSection title="付款/收款信息">
        <DetailKV label="本方账号" value={editForm.bank_account} />
        <DetailKV label="付款方名称" value={editForm.payer_name} />
        <DetailKV label="付款方账号" value={editForm.payer_account} />
        <DetailKV label="付款方开户行" value={editForm.payer_bank_name} />
        <DetailKV label="收款方名称" value={editForm.payee_name} />
        <DetailKV label="收款方账号" value={editForm.payee_account} />
        <DetailKV label="收款方开户行" value={editForm.payee_bank_name} />
      </DetailSection>
      <DetailSection title="金额信息">
        <DetailKV label="金额" value={fmtYuan(editForm.amount)} />
        <DetailKV label="收入" value={fmtYuan(editForm.income_amount)} />
        <DetailKV label="支出" value={fmtYuan(editForm.expense_amount)} />
        <DetailKV label="币种" value={editForm.currency} />
      </DetailSection>
      <DetailSection title="业务信息">
        <DetailKV label="流水号" value={editForm.transaction_no} />
        <DetailKV label="指令编号" value={editForm.instruction_no} />
        <DetailKV label="用途" value={editForm.purpose} />
        <DetailKV label="摘要" value={editForm.summary} />
        <DetailKV label="备注" value={editForm.remark} />
      </DetailSection>
      <DetailSection title="附件">
        {editForm.attachment_url?.trim() ? (
          <a
            className="bank-ledger-detail__link"
            href={attachmentHref(editForm.attachment_url)}
            target="_blank"
            rel="noopener noreferrer"
          >
            查看附件
          </a>
        ) : (
          <span className="bank-ledger-detail__muted">{NA}</span>
        )}
      </DetailSection>
    </>
  )

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

          <div className="reconciliation-rd__table-card bank-ledger-table-card">
            <div className="table-wrapper">
              <table className="bank-ledger-table">
                <thead>
                  <tr>
                    <th className="bank-ledger-table__th">类型</th>
                    <th className="bank-ledger-table__th bank-ledger-table__th--center">交易日期</th>
                    <th className="bank-ledger-table__th">交易对象</th>
                    <th className="bank-ledger-table__th bank-ledger-table__th--right">金额信息</th>
                    <th className="bank-ledger-table__th">业务标识</th>
                    <th className="bank-ledger-table__th bank-ledger-table__th--center">状态</th>
                    <th className="bank-ledger-table__th bank-ledger-table__th--center">创建时间</th>
                    <th className="bank-ledger-table__th bank-ledger-table__th--center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="bank-ledger-table__empty">
                        {loading ? '加载中…' : '暂无数据'}
                      </td>
                    </tr>
                  ) : (
                    items.map((row) => {
                      const cpSub = buildCounterpartySub(row)
                      const amt = buildAmountDisplay(row)
                      const biz = buildBizLines(row)
                      return (
                        <tr key={row.id} className="bank-ledger-table__row">
                          <td className="bank-ledger-table__td">{TYPE_LABELS[row.type] || row.type}</td>
                          <td className="bank-ledger-table__td bank-ledger-table__td--center">
                            {row.trade_date?.trim() || NA}
                          </td>
                          <td className="bank-ledger-table__td bank-ledger-table__td--multi">
                            <div className="bank-ledger-table__primary">{buildCounterpartyPrimary(row)}</div>
                            {cpSub ? <div className="bank-ledger-table__sub">{cpSub}</div> : null}
                          </td>
                          <td className="bank-ledger-table__td bank-ledger-table__td--right bank-ledger-table__td--multi">
                            <div className="bank-ledger-table__amount-main">{amt.main}</div>
                            <div className="bank-ledger-table__sub">{amt.sub}</div>
                          </td>
                          <td className="bank-ledger-table__td bank-ledger-table__td--multi">
                            {biz.length === 0 ? (
                              <span className="bank-ledger-table__muted">{NA}</span>
                            ) : (
                              biz.map((line) => (
                                <div key={`${row.id}-${line.t}`} className="bank-ledger-table__biz-line">
                                  {line.v}
                                </div>
                              ))
                            )}
                          </td>
                          <td className="bank-ledger-table__td bank-ledger-table__td--center">
                            <StatusTag status={row.status} />
                          </td>
                          <td className="bank-ledger-table__td bank-ledger-table__td--center bank-ledger-table__td--nowrap">
                            {fmtDtShort(row.created_at)}
                          </td>
                          <td className="bank-ledger-table__td bank-ledger-table__td--center">
                            <div className="bank-ledger__actions" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="rec-btn rec-btn--primary rec-btn--xs"
                                onClick={() => openView(row.id)}
                              >
                                详情
                              </button>
                              <button
                                type="button"
                                className="rec-btn rec-btn--secondary rec-btn--xs"
                                onClick={() => openEdit(row.id)}
                              >
                                编辑
                              </button>
                              <div className="bank-ledger__more-wrap">
                                <button
                                  type="button"
                                  className="rec-btn rec-btn--ghost rec-btn--xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActionMenuId((id) => (id === row.id ? null : row.id))
                                  }}
                                >
                                  更多
                                </button>
                                {actionMenuId === row.id ? (
                                  <div
                                    className="bank-ledger__dropdown"
                                    role="menu"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      className="bank-ledger__dropdown-item bank-ledger__dropdown-item--danger"
                                      onClick={() => handleDelete(row.id)}
                                    >
                                      删除
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <p style={{ marginTop: 8, fontSize: 13, color: 'var(--admin-text-sub, #64748b)' }}>
            共 {total} 条（本页最多 100 条，可改筛选条件后查询）
          </p>
        </div>
      </div>

      {modal.open ? (
        <>
          <button
            type="button"
            className="rec-drawer-backdrop"
            aria-label="关闭"
            onClick={closeModal}
          />
          <aside className="rec-drawer rec-drawer--wide rec-drawer--light bank-ledger-drawer">
            <div className="rec-drawer__tools bank-ledger-drawer__head">
              <div>
                <h3 className="bank-ledger-drawer__title">
                  {modal.mode === 'edit' ? '编辑银行流水' : '银行流水详情'}
                </h3>
                <p className="rec-drawer__title-sub">统一台账 · 流水导入 / 付款 / 回款</p>
              </div>
              <button type="button" className="rec-btn rec-btn--ghost rec-btn--xs" onClick={closeModal}>
                关闭
              </button>
            </div>
            <div className="rec-drawer__body">
              {modal.mode === 'view' ? (
                renderViewBody()
              ) : (
                <form
                  id="bank-ledger-edit-form"
                  onSubmit={(ev) => {
                    ev.preventDefault()
                    handleSaveEdit(ev)
                  }}
                >
                  <DetailSection title="基本信息">
                    <div className="rec-bank-payment__grid">
                      <label className="rec-bank-payment__field">
                        记录类型
                        <select
                          className="admin-input"
                          value={editForm.type}
                          onChange={setField('type')}
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
                        />
                      </label>
                      <label className="rec-bank-payment__field rec-bank-payment__field--full">
                        状态（paid / pending / draft 等）
                        <input
                          className="admin-input"
                          value={editForm.status}
                          onChange={setField('status')}
                        />
                      </label>
                    </div>
                  </DetailSection>
                  <DetailSection title="付款/收款信息">
                    <div className="rec-bank-payment__grid">
                      <label className="rec-bank-payment__field rec-bank-payment__field--full">
                        银行账户（本方）
                        <input
                          className="admin-input"
                          value={editForm.bank_account}
                          onChange={setField('bank_account')}
                        />
                      </label>
                      <label className="rec-bank-payment__field rec-bank-payment__field--full">
                        付款方名称
                        <input
                          className="admin-input"
                          value={editForm.payer_name}
                          onChange={setField('payer_name')}
                        />
                      </label>
                      <label className="rec-bank-payment__field">
                        付款方账号
                        <input
                          className="admin-input"
                          value={editForm.payer_account}
                          onChange={setField('payer_account')}
                        />
                      </label>
                      <label className="rec-bank-payment__field rec-bank-payment__field--full">
                        付款方开户行
                        <input
                          className="admin-input"
                          value={editForm.payer_bank_name}
                          onChange={setField('payer_bank_name')}
                        />
                      </label>
                      <label className="rec-bank-payment__field rec-bank-payment__field--full">
                        收款方名称
                        <input
                          className="admin-input"
                          value={editForm.payee_name}
                          onChange={setField('payee_name')}
                        />
                      </label>
                      <label className="rec-bank-payment__field">
                        收款方账号
                        <input
                          className="admin-input"
                          value={editForm.payee_account}
                          onChange={setField('payee_account')}
                        />
                      </label>
                      <label className="rec-bank-payment__field rec-bank-payment__field--full">
                        收款方开户行
                        <input
                          className="admin-input"
                          value={editForm.payee_bank_name}
                          onChange={setField('payee_bank_name')}
                        />
                      </label>
                    </div>
                  </DetailSection>
                  <DetailSection title="金额信息">
                    <div className="rec-bank-payment__grid">
                      <label className="rec-bank-payment__field">
                        金额
                        <input
                          className="admin-input"
                          value={editForm.amount}
                          onChange={setField('amount')}
                        />
                      </label>
                      <label className="rec-bank-payment__field">
                        收入金额
                        <input
                          className="admin-input"
                          value={editForm.income_amount}
                          onChange={setField('income_amount')}
                        />
                      </label>
                      <label className="rec-bank-payment__field">
                        支出金额
                        <input
                          className="admin-input"
                          value={editForm.expense_amount}
                          onChange={setField('expense_amount')}
                        />
                      </label>
                      <label className="rec-bank-payment__field">
                        币种
                        <input
                          className="admin-input"
                          value={editForm.currency}
                          onChange={setField('currency')}
                        />
                      </label>
                    </div>
                  </DetailSection>
                  <DetailSection title="业务信息">
                    <div className="rec-bank-payment__grid">
                      <label className="rec-bank-payment__field">
                        交易流水号
                        <input
                          className="admin-input"
                          value={editForm.transaction_no}
                          onChange={setField('transaction_no')}
                        />
                      </label>
                      <label className="rec-bank-payment__field">
                        指令编号
                        <input
                          className="admin-input"
                          value={editForm.instruction_no}
                          onChange={setField('instruction_no')}
                        />
                      </label>
                      <label className="rec-bank-payment__field rec-bank-payment__field--full">
                        摘要
                        <input
                          className="admin-input"
                          value={editForm.summary}
                          onChange={setField('summary')}
                        />
                      </label>
                      <label className="rec-bank-payment__field rec-bank-payment__field--full">
                        用途
                        <input
                          className="admin-input"
                          value={editForm.purpose}
                          onChange={setField('purpose')}
                        />
                      </label>
                      <label className="rec-bank-payment__field rec-bank-payment__field--full">
                        备注
                        <textarea
                          className="admin-input"
                          rows={2}
                          value={editForm.remark}
                          onChange={setField('remark')}
                        />
                      </label>
                      <label className="rec-bank-payment__field rec-bank-payment__field--full">
                        附件 URL
                        <input
                          className="admin-input"
                          value={editForm.attachment_url}
                          onChange={setField('attachment_url')}
                        />
                      </label>
                      <label className="rec-bank-payment__field rec-bank-payment__field--full">
                        原始粘贴文本
                        <textarea
                          className="admin-input"
                          rows={4}
                          value={editForm.raw_text}
                          onChange={setField('raw_text')}
                        />
                      </label>
                    </div>
                  </DetailSection>
                </form>
              )}
            </div>
            <div className="rec-drawer__footer">
              <div className="rec-drawer__footer-actions">
                {modal.mode === 'view' ? (
                  <>
                    <button type="button" className="rec-btn rec-btn--ghost" onClick={closeModal}>
                      关闭
                    </button>
                    {modal.id ? (
                      <button
                        type="button"
                        className="rec-btn rec-btn--ghost bank-ledger-drawer__btn-danger"
                        onClick={() => handleDelete(modal.id)}
                      >
                        删除
                      </button>
                    ) : null}
                  </>
                ) : (
                  <button type="button" className="rec-btn rec-btn--ghost" onClick={closeModal}>
                    取消
                  </button>
                )}
              </div>
              <div className="rec-drawer__footer-actions">
                {modal.mode === 'view' ? (
                  <button
                    type="button"
                    className="rec-btn rec-btn--primary"
                    onClick={() => setModal((m) => ({ ...m, mode: 'edit' }))}
                  >
                    改为编辑
                  </button>
                ) : (
                  <button
                    type="submit"
                    form="bank-ledger-edit-form"
                    className="rec-btn rec-btn--primary"
                    disabled={saving}
                  >
                    {saving ? '保存中…' : '保存'}
                  </button>
                )}
              </div>
            </div>
          </aside>
        </>
      ) : null}
    </PageContainer>
  )
}
