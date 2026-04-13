import React from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import PageContainer from '@/components/layout/PageContainer.jsx'
import QuickActions from '@/components/QuickActions.jsx'
import SummaryCard from '@/components/SummaryCard.jsx'
import DataValidator from '@/components/DataValidator.jsx'
import StatisticsChart from '@/components/StatisticsChart.jsx'
import AdvancedCharts from '@/components/AdvancedCharts.jsx'
import StatisticsReport from '@/components/StatisticsReport.jsx'
import { STATUS_OPTIONS } from '@/components/StatusManager.jsx'
import { calculateSettlementAmount } from '@/domain/settlement/calculateSettlementAmount.js'
import { computeStatusAggregates } from '@/domain/reconciliation/reconciliationStats.js'
import { VIEWS } from '@/app/routes.js'
import { useExceptionItems } from '@/hooks/useExceptionItems.js'

const ICON = {
  save: '\u{1F4BE}',
  doc: '\u{1F4CB}',
  money: '\u{1F4B0}',
  ticket: '\u{1F3AB}',
  bill: '\u{1F4B5}',
  chart: '\u{1F4CA}',
  refund: '\u{21A9}\u{FE0F}',
  lab: '\u{1F9EA}',
  trend: '\u{1F4C8}',
  alert: '\u{26A0}\u{FE0F}'
}

function DashboardPage() {
  const { recon, showToast, setActiveView } = useAppState()
  const { pendingCount: pendingExceptionCount } = useExceptionItems()
  const {
    records,
    statistics,
    lastSaveTime,
    handleClearAll,
    handleExportAll,
    updateRecord,
    setRecords
  } = recon

  const statusAggregates = computeStatusAggregates(records, STATUS_OPTIONS)

  return (
    <PageContainer hideHeader>
      {lastSaveTime && (
        <div className="save-indicator">
          <span className="save-time">
            {ICON.save} 已自动保存 {lastSaveTime.toLocaleTimeString('zh-CN')}
          </span>
          <span className="shortcut-hint">
            Ctrl+F 搜索 · Ctrl+P 打印 · Ctrl+Enter 保存编辑
          </span>
        </div>
      )}
      <div className="quick-actions-section">
        <QuickActions
          onClearAll={handleClearAll}
          onExportAll={handleExportAll}
          onImportData={() => {
            const fileInput = document.createElement('input')
            fileInput.type = 'file'
            fileInput.accept = '.json,.xlsx,.xls'
            fileInput.onchange = (e) => {
              const file = e.target.files?.[0]
              if (file) {
                if (file.name.endsWith('.json')) {
                  const reader = new FileReader()
                  reader.onload = (ev) => {
                    try {
                      const data = JSON.parse(ev.target.result)
                      if (data.records) setRecords(data.records)
                      showToast('数据导入成功！', 'success')
                    } catch {
                      showToast('导入失败：文件格式错误', 'error')
                    }
                  }
                  reader.readAsText(file)
                } else {
                  showToast('请使用 Excel 导入功能', 'info')
                }
              }
            }
            fileInput.click()
          }}
          onGenerateTemplate={() => setActiveView(VIEWS.SETTINGS_APP)}
          onShowTags={() => setActiveView(VIEWS.SETTINGS_TAGS)}
          onShowReminders={() => setActiveView(VIEWS.SETTINGS_REMINDERS)}
          recordCount={records.length}
          statistics={statistics}
        />
      </div>
      <div className="summary-section">
        <SummaryCard title="记录总数" value={statistics.recordCount} icon={ICON.doc} />
        <SummaryCard title="游戏流水总额" value={`¥${statistics.totalGameFlow.toFixed(2)}`} icon={ICON.money} />
        <SummaryCard title="代金券总额" value={`¥${statistics.totalVoucher.toFixed(2)}`} icon={ICON.ticket} />
        <SummaryCard title="结算金额总额" value={`¥${statistics.totalSettlementAmount.toFixed(2)}`} icon={ICON.bill} />
        <SummaryCard title="平均结算金额" value={`¥${statistics.avgSettlementAmount.toFixed(2)}`} icon={ICON.chart} />
        <SummaryCard title="退款总额" value={`¥${statistics.totalRefund.toFixed(2)}`} icon={ICON.refund} />
        <SummaryCard title="测试费总额" value={`¥${statistics.totalTestingFee.toFixed(2)}`} icon={ICON.lab} />
        <SummaryCard title="平均游戏流水" value={`¥${statistics.avgGameFlow.toFixed(2)}`} icon={ICON.trend} />
        <SummaryCard
          title="待处理业务异常"
          value={pendingExceptionCount}
          icon={ICON.alert}
          onClick={() => setActiveView(VIEWS.RECON_EXCEPTIONS)}
        />
      </div>
      <div className="status-summary-section">
        <h3 className="status-summary-title">
          {ICON.chart} 状态统计
        </h3>
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
      </div>
      <div className="validator-section">
        <DataValidator
          records={records}
          calculateSettlementAmount={calculateSettlementAmount}
          onIssueClick={() => {
            setActiveView(VIEWS.RECON_RD)
            showToast('请查找并修复该记录', 'info')
          }}
          onAutoFix={(recordId, field, value) => {
            const record = records.find((r) => r.id === recordId)
            if (record) {
              const updatedRecord = { ...record, [field]: value }
              updateRecord(recordId, updatedRecord)
              showToast(`已自动修复记录 #${records.indexOf(record) + 1} 的${field}`, 'success')
            }
          }}
        />
      </div>
      <div className="statistics-section">
        <StatisticsChart records={records} />
      </div>
      <div className="advanced-charts-section">
        <AdvancedCharts records={records} />
      </div>
      <div className="report-section">
        <StatisticsReport records={records} />
      </div>
    </PageContainer>
  )
}

export default DashboardPage
