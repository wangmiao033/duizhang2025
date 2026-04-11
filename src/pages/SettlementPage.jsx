import React from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import PageContainer from '@/components/layout/PageContainer.jsx'
import BillExport from '@/components/BillExport.jsx'
import BillManager from '@/components/BillManager.jsx'
import ChannelBilling from '@/components/ChannelBilling.jsx'
import AdminFilterBar from '@/components/admin/AdminFilterBar.jsx'
import AdminActionBar from '@/components/admin/AdminActionBar.jsx'
import AdminStatsRow from '@/components/admin/AdminStatsRow.jsx'
import AdminTableCard from '@/components/admin/AdminTableCard.jsx'
import ReconciliationStatsCards from '@/components/reconciliation/ReconciliationStatsCards.jsx'
import { STATUS_OPTIONS } from '@/components/StatusManager.jsx'
import { computeStatusAggregates } from '@/domain/reconciliation/reconciliationStats.js'
import { VIEWS } from '@/app/routes.js'
import '@/components/reconciliation/reconciliation-admin.css'

function SettlementPage({ section }) {
  const { recon, settings, showToast, setActiveView } = useAppState()
  const {
    records,
    statistics,
    handleLoadBill,
    handleExportError,
    channelRecords,
    onChannelAddRecord,
    onChannelAddRecordsBatch,
    onChannelUpdateRecord,
    onChannelDeleteRecord
  } = recon
  const { partyA, partyB, settlementMonth } = settings

  const statusAggregates = computeStatusAggregates(records, STATUS_OPTIONS)

  const titles = {
    [VIEWS.SETTLE_MONTHLY]: '月度结算单',
    [VIEWS.SETTLE_CHANNEL]: '渠道结算单',
    [VIEWS.SETTLE_STATUS]: '结算状态'
  }

  if (section === VIEWS.SETTLE_MONTHLY) {
    return (
      <PageContainer
        title={titles[section]}
        description="结算单据与状态总览"
        className="page-container--recon-rd"
      >
        <div className="reconciliation-rd settlement-monthly-workbench">
          <AdminFilterBar className="settlement-workbench__filter">
            <div className="settlement-workbench__meta">
              <div className="settlement-workbench__meta-item">
                <span className="settlement-workbench__meta-label">结算月份</span>
                <span className="settlement-workbench__meta-value">{settlementMonth || '未设置'}</span>
              </div>
              <div className="settlement-workbench__meta-item">
                <span className="settlement-workbench__meta-label">当前对账记录</span>
                <span className="settlement-workbench__meta-value">{records.length} 条</span>
              </div>
              <div className="settlement-workbench__meta-item settlement-workbench__meta-item--wide muted">
                <span className="settlement-workbench__meta-label">主体</span>
                <span
                  className="settlement-workbench__meta-value"
                  title={`${partyA?.invoiceTitle || '—'} / ${partyB?.companyName || '—'}`}
                >
                  付方 {partyA?.invoiceTitle || '—'} · 收方 {partyB?.companyName || '—'}
                </span>
              </div>
            </div>
          </AdminFilterBar>

          <AdminActionBar className="settlement-workbench__actions">
            <div className="rec-toolbar settlement-workbench__toolbar">
              <div className="rec-toolbar__primary settlement-workbench__export-slot">
                <BillExport
                  variant="toolbar"
                  records={records}
                  partyA={partyA}
                  partyB={partyB}
                  settlementMonth={settlementMonth}
                  statistics={statistics}
                  onExportSuccess={(message) => showToast(message || '账单导出成功！', 'success')}
                  onExportError={handleExportError}
                />
              </div>
              <p className="settlement-workbench__hint muted">
                导出基于当前列表数据与统计，支持 Excel / PDF / CSV。
              </p>
            </div>
          </AdminActionBar>

          <AdminStatsRow>
            <ReconciliationStatsCards filteredRecords={records} compact />
          </AdminStatsRow>

          <AdminTableCard className="settlement-saved-bills-card channel-rd__table-card">
            <div className="settlement-saved-bills-card__head">
              <h3 className="admin-page-section__title">已存账单</h3>
              <span className="muted settlement-saved-bills-card__sub">
                加载后将替换当前工作台中的对账数据视图（逻辑与原先一致）
              </span>
            </div>
            <div className="admin-table-card__body settlement-saved-bills-card__body">
              <BillManager
                embedded
                records={records}
                partyA={partyA}
                partyB={partyB}
                settlementMonth={settlementMonth}
                onLoadBill={handleLoadBill}
              />
            </div>
          </AdminTableCard>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer title={titles[section] || '结算管理'} description="结算单据与状态总览">
      {section === VIEWS.SETTLE_CHANNEL && (
        <ChannelBilling
          channelRecords={channelRecords}
          onAddRecord={onChannelAddRecord}
          onAddRecordsBatch={onChannelAddRecordsBatch}
          onUpdateRecord={onChannelUpdateRecord}
          onDeleteRecord={onChannelDeleteRecord}
        />
      )}

      {section === VIEWS.SETTLE_STATUS && (
        <div className="status-summary-section">
          <h3 className="status-summary-title">各状态金额汇总（研发对账）</h3>
          <div className="status-summary-grid">
            {statusAggregates.map((row) => (
              <div key={row.value} className="status-summary-card" style={{ borderColor: row.color }}>
                <div className="status-summary-header">
                  <span className="status-summary-icon">{row.icon}</span>
                  <span className="status-summary-label">{row.label}</span>
                </div>
                <div className="status-summary-content">
                  <div className="status-summary-count">{row.count} 条</div>
                  <div className="status-summary-amount">¥{row.amount.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="muted" style={{ marginTop: '16px' }}>
            修改记录状态请前往{' '}
            <button type="button" className="secondary-btn" onClick={() => setActiveView(VIEWS.RECON_RD)}>
              研发对账
            </button>
            。
          </p>
        </div>
      )}
    </PageContainer>
  )
}

export default SettlementPage
