import React from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import PageContainer from '@/components/layout/PageContainer.jsx'
import SearchFilter from '@/components/SearchFilter.jsx'
import DataForm from '@/components/DataForm.jsx'
import DataTable from '@/components/DataTable.jsx'
import BillExport from '@/components/BillExport.jsx'
import FilterSort from '@/components/FilterSort.jsx'
import BatchEdit from '@/components/BatchEdit.jsx'
import DataRecoveryHelper from '@/components/DataRecoveryHelper.jsx'
import HistoryPanel from '@/components/HistoryPanel.jsx'
import ExcelImport from '@/components/ExcelImport.jsx'
import DataBackup from '@/components/DataBackup.jsx'
import QuickFill from '@/components/QuickFill.jsx'
import TemplatePresets from '@/components/TemplatePresets.jsx'
import SettlementCycleManager from '@/components/SettlementCycleManager.jsx'
import { showNotification } from '@/components/NotificationCenter.jsx'
import { BatchStatusUpdate } from '@/components/StatusManager.jsx'
import { calculateSettlementAmount } from '@/domain/settlement/calculateSettlementAmount.js'
import { CYCLE_TYPES, getCurrentCycle } from '@/utils/settlementCycle.js'

function ReconciliationPage({ variant = 'full' }) {
  const { recon, settings, showToast } = useAppState()
  const {
    records,
    filteredRecords,
    searchTerm,
    setSearchTerm,
    filterOptions,
    setFilterOptions,
    sortOptions,
    setSortOptions,
    selectedCycleKey,
    setSelectedCycleKey,
    cycleType,
    setCycleType,
    selectedIds,
    handleSelectAll,
    handleSelectRecord,
    handleBatchDelete,
    handleBatchUpdate,
    handleBatchStatusUpdate,
    handleStatusChange,
    handleCopyRecord,
    handleReorder,
    addRecord,
    updateRecord,
    deleteRecord,
    handleExportFiltered,
    handleExportSelected,
    handleExportError,
    handleRestoreFromHistory,
    handleApplyTemplate,
    handleExcelImport,
    restoreFullData,
    statistics,
    quickFillData,
    setQuickFillData
  } = recon

  const {
    settlementMonth,
    partyA,
    partyB,
    partners,
    deliveries,
    setPartners
  } = settings

  const title = variant === 'master' ? '对账总表' : '研发对账'
  const description =
    variant === 'master'
      ? '按当前筛选查看全部对账记录（与研发对账共用数据）'
      : '录入与维护研发对账记录'

  return (
    <PageContainer title={title} description={description}>
      <div className="cycle-manager-section">
        <SettlementCycleManager
          records={records}
          selectedCycleKey={selectedCycleKey}
          cycleType={cycleType}
          onCycleChange={(cycleKey) => {
            setSelectedCycleKey(cycleKey)
            if (cycleKey === null) {
              showToast('已切换到显示全部记录', 'info')
            } else {
              showToast(`已切换到${cycleKey === '未设置' ? '未设置周期' : '周期：' + cycleKey}`, 'info')
            }
          }}
          onCycleTypeChange={(newCycleType) => {
            setCycleType(newCycleType)
            const currentCycle = getCurrentCycle(newCycleType)
            setSelectedCycleKey(currentCycle)
            showToast(
              `已切换到${newCycleType === CYCLE_TYPES.MONTHLY ? '月度' : newCycleType === CYCLE_TYPES.QUARTERLY ? '季度' : '年度'}视图`,
              'info'
            )
          }}
        />
      </div>
      <div className="toolbar-section">
        <SearchFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          resultCount={filteredRecords.length}
          totalCount={records.length}
        />
        {(searchTerm || selectedCycleKey || Object.values(filterOptions).some((v) => v)) && (
          <button
            className="clear-filters-btn"
            type="button"
            onClick={() => {
              setSearchTerm('')
              setSelectedCycleKey(null)
              setFilterOptions({})
              showToast('已清除所有筛选条件', 'info')
            }}
            title="清除所有筛选条件"
          >
            清除筛选
          </button>
        )}
        <div className="toolbar-buttons">
          <BillExport
            records={records}
            partyA={partyA}
            partyB={partyB}
            settlementMonth={settlementMonth}
            statistics={statistics}
            onExportSuccess={(message) => showToast(message || '账单导出成功！', 'success')}
            onExportError={handleExportError}
          />
          <FilterSort
            onFilterChange={setFilterOptions}
            onSortChange={(field, order) => setSortOptions({ field, order })}
          />
          {filteredRecords.length < records.length && (
            <button
              type="button"
              className="export-filtered-btn"
              onClick={handleExportFiltered}
              title="导出当前筛选结果"
            >
              导出筛选结果 ({filteredRecords.length})
            </button>
          )}
          {selectedIds.length > 0 && (
            <button
              type="button"
              className="export-selected-btn"
              onClick={handleExportSelected}
              title="导出选中记录"
            >
              导出选中 ({selectedIds.length})
            </button>
          )}
          <DataRecoveryHelper
            records={records}
            onDataRestored={(data) => {
              restoreFullData(data)
              showToast('数据已恢复！', 'success')
            }}
          />
          <HistoryPanel onRestore={handleRestoreFromHistory} />
          <ExcelImport onImport={handleExcelImport} />
          <DataBackup
            records={records}
            partyA={partyA}
            partyB={partyB}
            settlementMonth={settlementMonth}
            partners={partners}
            deliveries={deliveries}
            onImport={(data) => {
              restoreFullData(data)
              showToast('数据导入成功！', 'success')
            }}
          />
        </div>
      </div>

      <div className="main-content">
        {variant === 'full' && (
          <div className="form-section">
            <div className="form-header">
              <h3>添加对账记录</h3>
              <div className="form-header-actions">
                <QuickFill
                  onFill={(data) => {
                    setQuickFillData(data)
                    showNotification('快速填充模板已应用', 'success')
                  }}
                />
                <TemplatePresets onApplyTemplate={handleApplyTemplate} />
              </div>
            </div>
            <DataForm
              onAddRecord={addRecord}
              settlementMonth={settlementMonth}
              onError={(msg) => showToast(msg, 'error')}
              quickFillData={quickFillData}
              partners={partners}
              onAddPartner={(name) => {
                const newPartner = {
                  id: Date.now(),
                  name,
                  category: '游戏研发商',
                  tag2: '',
                  createdAt: new Date().toISOString()
                }
                setPartners([...partners, newPartner])
                showToast(`客户"${name}"已添加到客户库`, 'success')
              }}
            />
          </div>
        )}

        <div className="table-section">
          <div className="table-actions">
            {selectedIds.length > 0 && (
              <>
                <BatchEdit selectedIds={selectedIds} records={records} onBatchUpdate={handleBatchUpdate} />
                <BatchStatusUpdate selectedIds={selectedIds} onBatchStatusUpdate={handleBatchStatusUpdate} />
              </>
            )}
          </div>
          <DataTable
            records={filteredRecords}
            onUpdateRecord={updateRecord}
            onDeleteRecord={deleteRecord}
            calculateSettlementAmount={calculateSettlementAmount}
            onUpdateSuccess={() => showToast('记录更新成功！', 'success')}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectRecord={handleSelectRecord}
            onBatchDelete={handleBatchDelete}
            onCopyRecord={handleCopyRecord}
            onReorder={handleReorder}
            sortOptions={sortOptions}
            onSortChange={(field, order) => setSortOptions({ field, order })}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>
    </PageContainer>
  )
}

export default ReconciliationPage
