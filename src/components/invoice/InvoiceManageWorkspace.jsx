import React, { useMemo, useState } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import AdminWorkspace from '@/components/admin/AdminWorkspace.jsx'
import AdminFilterBar from '@/components/admin/AdminFilterBar.jsx'
import AdminActionBar from '@/components/admin/AdminActionBar.jsx'
import AdminStatsRow from '@/components/admin/AdminStatsRow.jsx'
import AdminTableCard from '@/components/admin/AdminTableCard.jsx'
import AdminListEmptyState from '@/components/admin/AdminListEmptyState.jsx'
import InvoiceLightDrawer from '@/components/invoice/InvoiceLightDrawer.jsx'
import '@/components/reconciliation/reconciliation-admin.css'
import { sumVerifiedSettlementAmount } from '@/domain/invoice/invoiceVerification.js'
import { VIEWS } from '@/app/routes.js'

/**
 * 发票管理 / 发票核销 共用列表工作台（无完整表单）
 * @param {'manage' | 'verify'} variant
 */
function InvoiceManageWorkspace({ variant = 'manage' }) {
  const { invoice, recon, setActiveView, setActiveViewRaw, openInvoiceEdit } = useAppState()

  const {
    filteredInvoices,
    invoiceFilter,
    setInvoiceFilter,
    invoiceFileInputRef,
    handleDeleteInvoice,
    handleOpenVerification,
    handleExportInvoiceJSON,
    handleExportInvoiceCSV,
    handleImportInvoiceJSON,
    updateInvoiceRecord
  } = invoice

  const { records } = recon
  const [drawerRecord, setDrawerRecord] = useState(null)

  const stats = useMemo(() => {
    const totalAmt = filteredInvoices.reduce((s, i) => s + parseFloat(i.amount || 0), 0)
    const verifiedCount = filteredInvoices.filter((i) => i.verified).length
    return { totalAmt, verifiedCount }
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
          <label className="channel-rd__field channel-rd__field--grow">
            <span className="channel-rd__label">搜索</span>
            <input
              type="search"
              className="admin-input channel-rd__search"
              placeholder="抬头/税号/备注"
              value={invoiceFilter.keyword}
              onChange={(e) => setInvoiceFilter({ ...invoiceFilter, keyword: e.target.value })}
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
                  onClick={() => setActiveView(VIEWS.INVOICE_CREATE)}
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
            { label: '当前条数', value: String(filteredInvoices.length) },
            { label: '金额合计', value: `¥${stats.totalAmt.toFixed(2)}`, emphasize: true },
            { label: '已核销条数', value: String(stats.verifiedCount) }
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
        {filteredInvoices.length === 0 ? (
          <AdminListEmptyState
            title="暂无发票记录"
            description={
              variant === 'manage'
                ? '可新增发票或通过列表页导入 JSON / PDF。'
                : '调整搜索或状态筛选；核销请在列表中点击「核销」。'
            }
            primaryAction={
              variant === 'manage'
                ? { label: '新增发票', onClick: () => setActiveView(VIEWS.INVOICE_CREATE) }
                : undefined
            }
          />
        ) : (
          <div className="invoice-table invoice-table--workspace">
            <div className="invoice-table-head">
              <span>抬头</span>
              <span>税号</span>
              <span>金额</span>
              <span>状态</span>
              <span>开票日期</span>
              <span>核销状态</span>
              <span>备注</span>
              <span>操作</span>
            </div>
            {filteredInvoices.map((item) => {
              const verifiedRecordIds = item.verifiedRecordIds || []
              const verifiedAmount = sumVerifiedSettlementAmount(records, verifiedRecordIds)
              return (
                <div className="invoice-table-row" key={item.id}>
                  <span title={item.title}>{item.title || '-'}</span>
                  <span title={item.taxNo}>{item.taxNo || '-'}</span>
                  <span>¥{item.amount || '0.00'}</span>
                  <span className={`tag tag-${item.status}`}>{item.status}</span>
                  <span>{item.issueDate || '-'}</span>
                  <span>
                    {item.verified ? (
                      <span
                        className="tag tag-verified"
                        title={'已核销 ' + verifiedRecordIds.length + ' 条记录，¥' + verifiedAmount.toFixed(2)}
                      >
                        已核销 ({verifiedRecordIds.length})
                      </span>
                    ) : (
                      <span className="tag tag-unverified">未核销</span>
                    )}
                  </span>
                  <span title={item.remark}>{item.remark || '-'}</span>
                  <span className="invoice-table-row__actions">
                    <button type="button" className="edit-btn" onClick={() => setDrawerRecord(item)}>
                      查看
                    </button>
                    {variant === 'manage' ? (
                      <button type="button" className="edit-btn" onClick={() => openInvoiceEdit(item.id)}>
                        编辑
                      </button>
                    ) : null}
                    <button type="button" className="verify-btn" onClick={() => handleOpenVerification(item)}>
                      核销
                    </button>
                    {variant === 'manage' ? (
                      <button type="button" className="delete-btn" onClick={() => handleDeleteInvoice(item.id)}>
                        删除
                      </button>
                    ) : null}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </AdminTableCard>

      <InvoiceLightDrawer
        open={Boolean(drawerRecord)}
        record={drawerRecord}
        onClose={() => setDrawerRecord(null)}
        onUpdateRecord={(id, rec) => updateInvoiceRecord(id, rec)}
        onNavigateToFullEdit={(id) => openInvoiceEdit(id)}
        onOpenVerification={variant === 'verify' || variant === 'manage' ? handleOpenVerification : undefined}
      />
    </AdminWorkspace>
  )
}

export default InvoiceManageWorkspace
