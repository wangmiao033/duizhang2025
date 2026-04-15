import React, { useEffect, useMemo, useState } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import InvoicePaymentLinkTools from '@/components/invoice/InvoicePaymentLinkTools.jsx'
import { useInvoicePaymentLinks } from '@/hooks/useInvoicePaymentLinks.js'
import AdminWorkspace from '@/components/admin/AdminWorkspace.jsx'
import AdminFilterBar from '@/components/admin/AdminFilterBar.jsx'
import AdminActionBar from '@/components/admin/AdminActionBar.jsx'
import AdminStatsRow from '@/components/admin/AdminStatsRow.jsx'
import AdminTableCard from '@/components/admin/AdminTableCard.jsx'
import InvoiceLightDrawer from '@/components/invoice/InvoiceLightDrawer.jsx'
import '@/components/reconciliation/reconciliation-admin.css'
import { getInvoiceRecordId } from '@/lib/api/invoice.ts'
import { getPaymentRecordId } from '@/lib/api/payment.ts'
import { VIEWS } from '@/app/routes.js'
import { consumeInvoiceFocus } from '@/lib/exceptions/navFocus.ts'

/**
 * 发票管理 / 发票核销 共用列表工作台（无完整表单）
 * @param {'manage' | 'verify'} variant
 * @param {'output' | 'input'} direction
 */
function InvoiceManageWorkspace({ variant = 'manage', direction = 'output' }) {
  const { invoice, setActiveView, setActiveViewRaw, openInvoiceEdit, settings, showToast } = useAppState()

  const {
    filteredInvoices,
    invoiceFilter,
    setInvoiceFilter,
    setInvoiceForm,
    invoiceFileInputRef,
    handleDeleteInvoice,
    handleOpenVerification,
    handleExportInvoiceJSON,
    handleExportInvoiceCSV,
    handleImportInvoiceJSON,
    updateInvoiceRecord
  } = invoice

  const [drawerRecord, setDrawerRecord] = useState(null)
  const { refresh: refreshIpLinks, byInvoiceId } = useInvoicePaymentLinks()
  const [focusInvoiceForLink, setFocusInvoiceForLink] = useState('')

  useEffect(() => {
    const id = consumeInvoiceFocus()
    if (id) setFocusInvoiceForLink(id)
  }, [])

  useEffect(() => {
    if (invoiceFilter.direction === direction) return
    setInvoiceFilter((prev) => ({ ...prev, direction }))
  }, [direction, invoiceFilter.direction, setInvoiceFilter])

  const paymentLabelById = useMemo(() => {
    const m = new Map()
    for (const p of settings?.deliveries || []) {
      const pid = getPaymentRecordId(p)
      const label = [p.partnerName, p.trackingNumber].filter(Boolean).join(' · ') || pid
      m.set(pid, label)
    }
    return m
  }, [settings?.deliveries])

  const drawerLinkedPayments = useMemo(() => {
    if (!drawerRecord) return []
    const rid = getInvoiceRecordId(drawerRecord)
    return (byInvoiceId.get(rid) || []).map((L) => ({
      linkId: L.id,
      paymentId: L.payment_id,
      label: paymentLabelById.get(L.payment_id) || L.payment_id
    }))
  }, [drawerRecord, byInvoiceId, paymentLabelById])

  const stats = useMemo(() => {
    return filteredInvoices.reduce(
      (acc, i) => {
        const amount = parseFloat(i.amount || 0) || 0
        const tax = parseFloat(i.taxAmount || 0) || 0
        const amountWithTax = parseFloat(i.amountWithTax || amount + tax) || 0
        return {
          count: acc.count + 1,
          totalAmount: acc.totalAmount + amount,
          totalTax: acc.totalTax + tax,
          totalAmountWithTax: acc.totalAmountWithTax + amountWithTax
        }
      },
      { count: 0, totalAmount: 0, totalTax: 0, totalAmountWithTax: 0 }
    )
  }, [filteredInvoices])

  const invoiceTypeOptions = useMemo(() => {
    const set = new Set()
    filteredInvoices.forEach((i) => {
      if (i.invoiceType) set.add(String(i.invoiceType))
    })
    return Array.from(set)
  }, [filteredInvoices])

  const wrapImport = (e) => {
    const file = e.target.files?.[0]
    handleImportInvoiceJSON(e)
    if (file?.name?.toLowerCase().endsWith('.pdf')) {
      setActiveViewRaw?.(VIEWS.INVOICE_CREATE)
    }
  }

  return (
    <AdminWorkspace className="invoice-rd-workspace">
      <AdminFilterBar>
        <div className="channel-rd__filters">
          <label className="channel-rd__field">
            <span className="channel-rd__label">开票日期起</span>
            <input
              type="date"
              className="admin-input channel-rd__month"
              value={invoiceFilter.dateStart || ''}
              onChange={(e) => setInvoiceFilter({ ...invoiceFilter, dateStart: e.target.value })}
            />
          </label>
          <label className="channel-rd__field">
            <span className="channel-rd__label">开票日期止</span>
            <input
              type="date"
              className="admin-input channel-rd__month"
              value={invoiceFilter.dateEnd || ''}
              onChange={(e) => setInvoiceFilter({ ...invoiceFilter, dateEnd: e.target.value })}
            />
          </label>
          <label className="channel-rd__field">
            <span className="channel-rd__label">票种</span>
            <select
              className="admin-input channel-rd__select"
              value={invoiceFilter.invoiceType || ''}
              onChange={(e) => setInvoiceFilter({ ...invoiceFilter, invoiceType: e.target.value })}
            >
              <option value="">全部</option>
              {invoiceTypeOptions.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          <label className="channel-rd__field channel-rd__field--grow">
            <span className="channel-rd__label">公司名/税号</span>
            <input
              type="search"
              className="admin-input channel-rd__search"
              placeholder={direction === 'output' ? '购买方名称/税号' : '销售方名称/税号'}
              value={invoiceFilter.companyKeyword || ''}
              onChange={(e) => setInvoiceFilter({ ...invoiceFilter, companyKeyword: e.target.value })}
            />
          </label>
          <label className="channel-rd__field channel-rd__field--grow">
            <span className="channel-rd__label">发票号码</span>
            <input
              type="search"
              className="admin-input channel-rd__search"
              placeholder="发票号码/数电发票号码"
              value={invoiceFilter.numberKeyword || ''}
              onChange={(e) => setInvoiceFilter({ ...invoiceFilter, numberKeyword: e.target.value })}
            />
          </label>
          <label className="channel-rd__field">
            <span className="channel-rd__label">状态</span>
            <select
              className="admin-input channel-rd__select"
              value={invoiceFilter.status}
              onChange={(e) => setInvoiceFilter({ ...invoiceFilter, status: e.target.value })}
            >
              <option value="全部">全部</option>
              <option value="未开">未开</option>
              <option value="已开">已开</option>
              <option value="作废">作废</option>
            </select>
          </label>
        </div>
      </AdminFilterBar>

      <AdminActionBar>
        <div className="rec-toolbar">
          <div className="rec-toolbar__primary">
            {variant === 'manage' ? (
              <>
                <button
                  type="button"
                  className="rec-btn rec-btn--primary"
                  onClick={() => {
                    setInvoiceForm((prev) => ({ ...prev, invoiceDirection: direction }))
                    setActiveView(VIEWS.INVOICE_CREATE)
                  }}
                >
                  新增发票
                </button>
                <button type="button" className="rec-btn rec-btn--secondary" onClick={handleExportInvoiceJSON}>
                  导出 JSON
                </button>
                <button type="button" className="rec-btn rec-btn--secondary" onClick={handleExportInvoiceCSV}>
                  导出 CSV
                </button>
                <button
                  type="button"
                  className="rec-btn rec-btn--secondary"
                  onClick={() => invoiceFileInputRef.current?.click()}
                >
                  导入 (JSON/PDF)
                </button>
                <input
                  ref={invoiceFileInputRef}
                  type="file"
                  accept=".json,.pdf"
                  className="channel-rd__file"
                  style={{ display: 'none' }}
                  onChange={wrapImport}
                />
                <InvoicePaymentLinkTools
                  invoiceRecords={invoice.invoiceRecords}
                  deliveries={settings?.deliveries || []}
                  onLinksChanged={() => void refreshIpLinks()}
                  showToast={showToast}
                  focusInvoiceId={focusInvoiceForLink}
                  onConsumedFocusInvoice={() => setFocusInvoiceForLink('')}
                />
              </>
            ) : (
              <span className="rec-toolbar__batch-label">在列表中点击「核销」勾选对账记录</span>
            )}
          </div>
        </div>
      </AdminActionBar>

      <AdminStatsRow>
        <div className="rec-stats-cards rec-stats-cards--compact" aria-label="发票概览">
          {[
            { label: '发票数量', value: String(stats.count) },
            { label: '合计金额', value: `¥${stats.totalAmount.toFixed(2)}` },
            { label: '合计税额', value: `¥${stats.totalTax.toFixed(2)}` },
            { label: '合计价税', value: `¥${stats.totalAmountWithTax.toFixed(2)}`, emphasize: true }
          ].map((c) => (
            <div
              key={c.label}
              className={`rec-stat-card ${c.emphasize ? 'rec-stat-card--emphasis' : ''}`}
            >
              <div className="rec-stat-card__label">{c.label}</div>
              <div className="rec-stat-card__value">{c.value}</div>
            </div>
          ))}
        </div>
      </AdminStatsRow>

      <AdminTableCard className="invoice-rd__table-card">
        <div className="invoice-table invoice-table--workspace">
          <div className="invoice-table-head">
            <span>序号</span>
            <span>票种</span>
            <span>数电发票号码</span>
            <span>发票代码</span>
            <span>发票号码</span>
            <span>{direction === 'output' ? '购买方纳税人名称' : '销售方名称'}</span>
            <span>{direction === 'output' ? '购买方纳税人识别号' : '销售方纳税人识别号'}</span>
            <span>金额</span>
            <span>税额</span>
            <span>价税合计</span>
            <span>开票日期</span>
            <span>开票人</span>
            <span>发票状态</span>
            <span>操作</span>
            <span>备注</span>
          </div>
          {filteredInvoices.length === 0 ? (
            <div className="invoice-table-row invoice-table-row--empty">
              <span className="invoice-table-empty-text">暂无发票数据，当前筛选无匹配记录</span>
            </div>
          ) : (
            filteredInvoices.map((item, idx) => {
              const rid = getInvoiceRecordId(item) || item.id
              const counterpartyName = direction === 'output' ? item.title : item.sellerName
              const counterpartyTaxNo = direction === 'output' ? item.taxNo : item.sellerTaxNo
              return (
                <div className="invoice-table-row" key={rid}>
                  <span>{idx + 1}</span>
                  <span>{item.invoiceType || '-'}</span>
                  <span title={item.digitalInvoiceNo}>{item.digitalInvoiceNo || '-'}</span>
                  <span>{item.invoiceCode || '-'}</span>
                  <span>{item.invoiceNo || '-'}</span>
                  <span title={counterpartyName}>{counterpartyName || '-'}</span>
                  <span title={counterpartyTaxNo}>{counterpartyTaxNo || '-'}</span>
                  <span className="invoice-table__num">¥{parseFloat(item.amount || 0).toFixed(2)}</span>
                  <span className="invoice-table__num">¥{parseFloat(item.taxAmount || 0).toFixed(2)}</span>
                  <span className="invoice-table__num">
                    ¥
                    {parseFloat(
                      item.amountWithTax || parseFloat(item.amount || 0) + parseFloat(item.taxAmount || 0)
                    ).toFixed(2)}
                  </span>
                  <span>{item.issueDate || '-'}</span>
                  <span>{item.issuer || '-'}</span>
                  <span className={`tag tag-${item.status}`}>{item.status}</span>
                  <span className="invoice-table-row__actions">
                    <button type="button" className="edit-btn" onClick={() => setDrawerRecord(item)}>
                      查看
                    </button>
                    {variant === 'manage' ? (
                      <button type="button" className="edit-btn" onClick={() => openInvoiceEdit(rid)}>
                        编辑
                      </button>
                    ) : null}
                    <button type="button" className="verify-btn" onClick={() => handleOpenVerification(item)}>
                      核销
                    </button>
                    {variant === 'manage' ? (
                      <button type="button" className="delete-btn" onClick={() => void handleDeleteInvoice(rid)}>
                        删除
                      </button>
                    ) : null}
                  </span>
                  <span className="invoice-table__remark" title={item.remark}>
                    {item.remark || '-'}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </AdminTableCard>

      <InvoiceLightDrawer
        open={Boolean(drawerRecord)}
        record={drawerRecord}
        onClose={() => setDrawerRecord(null)}
        onUpdateRecord={(id, rec) => updateInvoiceRecord(id, rec)}
        onNavigateToFullEdit={(id) => openInvoiceEdit(id)}
        onOpenVerification={variant === 'verify' || variant === 'manage' ? handleOpenVerification : undefined}
        linkedPaymentRows={drawerLinkedPayments}
        onLinksChanged={() => void refreshIpLinks()}
        onRequestManualLinkToPayment={(invId) => setFocusInvoiceForLink(invId)}
      />
    </AdminWorkspace>
  )
}

export default InvoiceManageWorkspace
