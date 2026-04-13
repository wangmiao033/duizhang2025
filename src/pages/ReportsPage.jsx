import React, { useState } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import PageContainer from '@/components/layout/PageContainer.jsx'
import ExcelImport from '@/components/ExcelImport.jsx'
import StatisticsChart from '@/components/StatisticsChart.jsx'
import AdvancedCharts from '@/components/AdvancedCharts.jsx'
import StatisticsReport from '@/components/StatisticsReport.jsx'
import ProjectProfit from '@/components/ProjectProfit.jsx'
import ExportButton from '@/components/ExportButton.jsx'
import CSVExport from '@/components/CSVExport.jsx'
import PDFExport from '@/components/PDFExport.jsx'
import PrintButton from '@/components/PrintButton.jsx'
import BillExport from '@/components/BillExport.jsx'
import { VIEWS } from '@/app/routes.js'
import '@/components/reconciliation/reconciliation-admin.css'

const EXPORT_TARGETS = [
  { id: 'recon', label: '研发对账' },
  { id: 'channel', label: '渠道对账' },
  { id: 'invoice', label: '发票' },
  { id: 'bill', label: '结算单' }
]

function ReportsPage({ section }) {
  const { recon, settings, invoice, showToast } = useAppState()
  const { records, statistics, channelRecords, handleExportError } = recon
  const { partyA, partyB, settlementMonth } = settings
  const { handleExportInvoiceJSON, handleExportInvoiceCSV } = invoice

  const [exportTarget, setExportTarget] = useState('recon')

  if (section === VIEWS.REPORTS_IMPORT) {
    return (
      <PageContainer hideHeader className="page-container--admin-workspace">
        <div className="admin-workspace">
          <div className="admin-workspace__card">
            <ExcelImport onImport={recon.handleExcelImport} />
          </div>
        </div>
      </PageContainer>
    )
  }

  if (section === VIEWS.REPORTS_STATS) {
    return (
      <PageContainer hideHeader className="page-container--admin-workspace">
        <div className="admin-workspace">
          <div className="admin-workspace__card">
            <div className="statistics-section">
              <StatisticsChart records={records} />
            </div>
            <div className="advanced-charts-section">
              <AdvancedCharts records={records} />
            </div>
            <div className="report-section">
              <StatisticsReport records={records} />
            </div>
          </div>
        </div>
      </PageContainer>
    )
  }

  if (section === VIEWS.REPORTS_PROFIT) {
    return (
      <PageContainer hideHeader className="page-container--admin-workspace">
        <div className="admin-workspace">
          <div className="admin-workspace__card">
            <div className="project-profit-section">
              <ProjectProfit records={records} channelRecords={channelRecords} />
            </div>
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer hideHeader className="page-container--admin-workspace">
      <div className="admin-workspace">
        <div className="admin-workspace__card export-center-panel">
          <div className="export-center-row">
            <label className="export-center-label">导出对象</label>
            <select
              className="export-center-select"
              value={exportTarget}
              onChange={(e) => setExportTarget(e.target.value)}
            >
              {EXPORT_TARGETS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <p className="muted" style={{ marginBottom: '12px' }}>
            格式与范围与原先各页面一致：研发对账支持 Excel/CSV/PDF/JSON/打印；发票为 JSON/CSV；结算单使用账单导出。
          </p>
          <div className="export-section">
            <div className="export-buttons">
              {exportTarget === 'recon' && (
              <>
                <ExportButton
                  records={records}
                  partyA={partyA}
                  partyB={partyB}
                  settlementMonth={settlementMonth}
                  totalGameFlow={statistics.totalGameFlow}
                  totalTestingFee={statistics.totalTestingFee}
                  totalVoucher={statistics.totalVoucher}
                  totalSettlementAmount={statistics.totalSettlementAmount}
                  onExportSuccess={() => showToast('对账单导出成功！', 'success')}
                  onExportError={handleExportError}
                />
                <CSVExport
                  records={records}
                  statistics={statistics}
                  onExportSuccess={() => showToast('CSV 导出成功！', 'success')}
                  onExportError={handleExportError}
                />
                <PDFExport
                  records={records}
                  partyA={partyA}
                  partyB={partyB}
                  settlementMonth={settlementMonth}
                  statistics={statistics}
                  onExportSuccess={() => showToast('PDF 导出成功！', 'success')}
                  onExportError={handleExportError}
                />
                <PrintButton
                  records={records}
                  partyA={partyA}
                  partyB={partyB}
                  settlementMonth={settlementMonth}
                  statistics={statistics}
                />
                <button type="button" className="secondary-btn" onClick={recon.handleExportAll}>
                  导出全部 JSON备份
                </button>
              </>
              )}
              {exportTarget === 'channel' && (
              <p className="muted">渠道对账请在「渠道对账 / 渠道结算单」页面内查看与复制数据；此处暂不重复实现新导出格式。</p>
              )}
              {exportTarget === 'invoice' && (
              <>
                <button type="button" className="secondary-btn" onClick={handleExportInvoiceJSON}>
                  发票 JSON
                </button>
                <button type="button" className="secondary-btn" onClick={handleExportInvoiceCSV}>
                  发票 CSV
                </button>
              </>
              )}
              {exportTarget === 'bill' && (
              <BillExport
                records={records}
                partyA={partyA}
                partyB={partyB}
                settlementMonth={settlementMonth}
                statistics={statistics}
                onExportSuccess={(message) => showToast(message || '账单导出成功！', 'success')}
                onExportError={handleExportError}
              />
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

export default ReportsPage
