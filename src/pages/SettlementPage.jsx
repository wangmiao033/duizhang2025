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
import { VIEWS } from '@/app/routes.js'
import '@/components/reconciliation/reconciliation-admin.css'

function SettlementPage({ section }) {
  const { recon, settings, showToast } = useAppState()
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

  if (section === VIEWS.SETTLE_MONTHLY) {
    return (
      <PageContainer hideHeader className="page-container--recon-rd">
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
    <PageContainer hideHeader>
      {section === VIEWS.SETTLE_CHANNEL && (
        <ChannelBilling
          channelRecords={channelRecords}
          onAddRecord={onChannelAddRecord}
          onAddRecordsBatch={onChannelAddRecordsBatch}
          onUpdateRecord={onChannelUpdateRecord}
          onDeleteRecord={onChannelDeleteRecord}
        />
      )}
    </PageContainer>
  )
}

export default SettlementPage
