import React, { useMemo } from 'react'
import BillExport from '@/components/BillExport.jsx'
import BatchEdit from '@/components/BatchEdit.jsx'
import { BatchStatusUpdate } from '@/components/StatusManager.jsx'
import { computeRecordsStatistics } from '@/domain/settlement/settlementSummary.js'

/**
 * 研发对账列表操作栏：主路径为独立新增页；导出 / 批量。
 */
function ReconciliationToolbar({
  onNavigateToCreate,
  records,
  filteredRecords,
  selectedIds,
  partyA,
  partyB,
  settlementMonth,
  statistics,
  onExportSuccess,
  onExportError,
  handleBatchUpdate,
  handleBatchStatusUpdate
}) {
  const selectedRecords =
    selectedIds.length > 0
      ? selectedIds
          .map((id) => records.find((record) => String(record.id) === String(id)))
          .filter(Boolean)
      : []
  const exportRecords = selectedRecords.length > 0 ? selectedRecords : filteredRecords
  const exportStatistics = useMemo(() => computeRecordsStatistics(exportRecords), [exportRecords])
  const exportLabel = selectedRecords.length > 0 ? `导出账单 (${selectedRecords.length})` : '导出账单'

  return (
    <div className="rec-toolbar">
      <div className="rec-toolbar__primary">
        <button type="button" className="rec-btn rec-btn--primary" onClick={onNavigateToCreate}>
          新增研发对账
        </button>
        <BillExport
          records={exportRecords}
          partyA={partyA}
          partyB={partyB}
          settlementMonth={settlementMonth}
          statistics={exportStatistics || statistics}
          onExportSuccess={(message) => onExportSuccess(message || '账单导出成功！')}
          onExportError={onExportError}
          triggerLabel={exportLabel}
          triggerTitle={
            selectedRecords.length > 0
              ? '导出当前勾选的研发对账记录'
              : '导出当前列表中的研发对账记录'
          }
          excelMenuLabel={selectedRecords.length > 0 ? '📊 导出选中账单' : '📊 导出当前列表'}
          excelMenuTitle={
            selectedRecords.length > 0
              ? '导出当前勾选的研发对账记录'
              : '导出当前列表中的研发对账记录'
          }
        />
        {selectedIds.length > 0 && (
          <div className="rec-toolbar__batch">
            <span className="rec-toolbar__batch-label">批量</span>
            <BatchEdit selectedIds={selectedIds} records={records} onBatchUpdate={handleBatchUpdate} />
            <BatchStatusUpdate selectedIds={selectedIds} onBatchStatusUpdate={handleBatchStatusUpdate} />
          </div>
        )}
      </div>
    </div>
  )
}

export default ReconciliationToolbar
