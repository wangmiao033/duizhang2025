import React from 'react'
import BillExport from '@/components/BillExport.jsx'
import ExcelImport from '@/components/ExcelImport.jsx'
import BatchEdit from '@/components/BatchEdit.jsx'
import { BatchStatusUpdate } from '@/components/StatusManager.jsx'

/**
 * 研发对账列表操作栏：主路径为独立新增页；Excel / 导出 / 批量。
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
  handleExportFiltered,
  handleExportSelected,
  handleExcelImport,
  handleBatchUpdate,
  handleBatchStatusUpdate
}) {
  return (
    <div className="rec-toolbar">
      <div className="rec-toolbar__primary">
        <button type="button" className="rec-btn rec-btn--primary" onClick={onNavigateToCreate}>
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
          triggerLabel="导出当前页账单"
          triggerTitle="导出当前列表中的全部记录（Excel / PDF / CSV），与「导出选中账单」不同"
          excelMenuLabel={'\uD83D\uDCCA \u5bfc\u51fa\u5f53\u524d\u9875\u8d26\u5355'}
          excelMenuTitle="将当前列表中的全部记录导出为一个 Excel 工作表（单张结算确认单）"
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
        <button
          type="button"
          className="rec-btn rec-btn--secondary"
          onClick={handleExportSelected}
          title={
            selectedIds.length > 0
              ? '仅导出当前勾选的研发对账记录（Excel）'
              : '请先勾选要导出的研发对账记录'
          }
        >
          导出选中账单 ({selectedIds.length})
        </button>
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
