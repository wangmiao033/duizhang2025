import React from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import PageContainer from '@/components/layout/PageContainer.jsx'
import BillExport from '@/components/BillExport.jsx'
import BillManager from '@/components/BillManager.jsx'
import ChannelBilling from '@/components/ChannelBilling.jsx'
import { STATUS_OPTIONS } from '@/components/StatusManager.jsx'
import { computeStatusAggregates } from '@/domain/reconciliation/reconciliationStats.js'
import { VIEWS } from '@/app/routes.js'

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

  return (
    <PageContainer title={titles[section] || '结算管理'} description="结算单据与状态总览">
      {section === VIEWS.SETTLE_MONTHLY && (
        <div className="settings-grid">
          <div className="config-section settings-card">
            <h3 className="section-title">账单导出</h3>
            <BillExport
              records={records}
              partyA={partyA}
              partyB={partyB}
              settlementMonth={settlementMonth}
              statistics={statistics}
              onExportSuccess={(message) => showToast(message || '账单导出成功！', 'success')}
              onExportError={handleExportError}
            />
          </div>
          <div className="config-section settings-card">
            <h3 className="section-title">已存账单</h3>
            <BillManager
              records={records}
              partyA={partyA}
              partyB={partyB}
              settlementMonth={settlementMonth}
              onLoadBill={handleLoadBill}
            />
          </div>
        </div>
      )}

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
