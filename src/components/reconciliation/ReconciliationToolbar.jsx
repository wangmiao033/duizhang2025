import React from 'react'
import BillExport from '@/components/BillExport.jsx'
import ExcelImport from '@/components/ExcelImport.jsx'
import BatchEdit from '@/components/BatchEdit.jsx'
import { BatchStatusUpdate } from '@/components/StatusManager.jsx'

/**
 * 研发对账主工作区操作栏：仅高频操作。低频工具已迁至侧边栏二级页。
 */
function ReconciliationToolbar({
  onAddClick,
  records,
  filteredRecords,
  selectedIds,
  partyA,
  partyB,
  settlementMonth,
  statistics,
  onExportSuccess,
  onExportError,
  handleExportFiltered,
  handleExportSelected,
  handleExcelImport,
  handleBatchUpdate,
  handleBatchStatusUpdate
}) {
  return (
    <div className="rec-toolbar">
      <div className="rec-toolbar__primary">
        <button type="button" className="rec-btn rec-btn--primary" onClick={onAddClick}>
          新增记录
        </button>
        <div className="rec-toolbar__excel">
          <ExcelImport onImport={handleExcelImport} />
        </div>
        <BillExport
          records={records}
          partyA={partyA}
          partyB={partyB}
          settlementMonth={settlementMonth}
          statistics={statistics}
          onExportSuccess={(message) => onExportSuccess(message || '账单导出成功！')}
          onExportError={onExportError}
        />
        {filteredRecords.length < records.length && (
          <button
            type="button"
            className="rec-btn rec-btn--secondary"
            onClick={handleExportFiltered}
            title="导出当前筛选结果"
          >
            导出筛选 ({filteredRecords.length})
          </button>
        )}
        {selectedIds.length > 0 && (
          <button
            type="button"
            className="rec-btn rec-btn--secondary"
            onClick={handleExportSelected}
            title="导出选中记录"
          >
            导出选中 ({selectedIds.length})
          </button>
        )}
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
