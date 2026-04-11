import React, { useState } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import PageContainer from '@/components/layout/PageContainer.jsx'
import SearchFilter from '@/components/SearchFilter.jsx'
import DataTable from '@/components/DataTable.jsx'
import BillExport from '@/components/BillExport.jsx'
import FilterSort from '@/components/FilterSort.jsx'
import BatchEdit from '@/components/BatchEdit.jsx'
import DataRecoveryHelper from '@/components/DataRecoveryHelper.jsx'
import HistoryPanel from '@/components/HistoryPanel.jsx'
import ExcelImport from '@/components/ExcelImport.jsx'
import DataBackup from '@/components/DataBackup.jsx'
import SettlementCycleManager from '@/components/SettlementCycleManager.jsx'
import ReconciliationStatsCards from '@/components/reconciliation/ReconciliationStatsCards.jsx'
import ReconciliationToolbar from '@/components/reconciliation/ReconciliationToolbar.jsx'
import ReconciliationLightDrawer from '@/components/reconciliation/ReconciliationLightDrawer.jsx'
import '@/components/reconciliation/reconciliation-admin.css'
import { BatchStatusUpdate } from '@/components/StatusManager.jsx'
import { calculateSettlementAmount } from '@/domain/settlement/calculateSettlementAmount.js'
import { CYCLE_TYPES, getCurrentCycle } from '@/utils/settlementCycle.js'
import { VIEWS } from '@/app/routes.js'

function ReconciliationPage({ variant = 'full' }) {
  const { recon, settings, showToast, setActiveView, openReconciliationEdit } = useAppState()
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
    updateRecord,
    deleteRecord,
    handleExportFiltered,
    handleExportSelected,
    handleExportError,
    handleRestoreFromHistory,
    handleExcelImport,
    restoreFullData,
    statistics
  } = recon

  const { settlementMonth, partyA, partyB, partners, deliveries, setPartners } = settings

  const [lightDrawerRecord, setLightDrawerRecord] = useState(null)

  const cycleBlock = (
    <SettlementCycleManager
      className={variant === 'full' ? 'settlement-cycle-manager--embed' : ''}
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
  )

  if (variant === 'full') {
    const hasActiveFilters = Boolean(
      searchTerm ||
        (selectedCycleKey !== null && selectedCycleKey !== undefined) ||
        Object.values(filterOptions || {}).some((v) => v !== '' && v != null) ||
        !!(sortOptions && sortOptions.field)
    )

    return (
      <PageContainer hideHeader className="page-container--recon-rd">
        <div className="reconciliation-rd">
          <div className="reconciliation-rd__filter-layer reconciliation-rd__filter-layer--single-row">
            <div className="reconciliation-rd__filter-strip">
              {cycleBlock}
            </div>
            <div className="reconciliation-rd__filter-row">
              <div className="reconciliation-rd__search">
                <SearchFilter
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  resultCount={filteredRecords.length}
                  totalCount={records.length}
                />
              </div>
              <div className="reconciliation-rd__filter-actions">
                <FilterSort
                  variant="inline"
                  filterValues={filterOptions}
                  sortField={sortOptions.field}
                  sortOrder={sortOptions.order}
                  onFilterChange={setFilterOptions}
                  onSortChange={(field, order) => setSortOptions({ field, order })}
                />
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="rec-btn rec-btn--ghost"
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedCycleKey(null)
                      setFilterOptions({})
                      setSortOptions({ field: '', order: 'desc' })
                      showToast('已清除搜索、周期与筛选', 'info')
                    }}
                    title="重置搜索、周期与筛选条件"
                  >
                    重置
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="reconciliation-rd__action-layer">
            <ReconciliationToolbar
              onNavigateToCreate={() => setActiveView(VIEWS.RECON_CREATE)}
              records={records}
              filteredRecords={filteredRecords}
              selectedIds={selectedIds}
              partyA={partyA}
              partyB={partyB}
              settlementMonth={settlementMonth}
              statistics={statistics}
              onExportSuccess={(message) => showToast(message || '账单导出成功！', 'success')}
              onExportError={handleExportError}
              handleExportFiltered={handleExportFiltered}
              handleExportSelected={handleExportSelected}
              handleExcelImport={handleExcelImport}
              handleBatchUpdate={handleBatchUpdate}
              handleBatchStatusUpdate={handleBatchStatusUpdate}
            />
          </div>

          <ReconciliationStatsCards filteredRecords={filteredRecords} compact />

          <div className="reconciliation-rd__table-card">
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
              columnPreset="compact"
              useDrawerForEdit={false}
              onRequestPageEdit={(r) => openReconciliationEdit(r.id)}
              onQuickView={(r) => setLightDrawerRecord(r)}
            />
          </div>
        </div>

        <ReconciliationLightDrawer
          open={Boolean(lightDrawerRecord)}
          record={lightDrawerRecord}
          onClose={() => setLightDrawerRecord(null)}
          onStatusChange={handleStatusChange}
          onUpdateRecord={updateRecord}
          onNavigateToFullEdit={(id) => openReconciliationEdit(id)}
        />
      </PageContainer>
    )
  }

  /* 对账总表：保留原结构（无右侧抽屉、表格全列）；主内容区须整行占满，避免沿用双列表栅格留下空白列 */
  return (
    <PageContainer
      title="对账总表"
      description="按当前筛选查看全部对账记录（与研发对账共用数据）"
      className="page-container--reconciliation-ledger"
    >
      <div className="reconciliation-ledger-page">
      <div className="cycle-manager-section">{cycleBlock}</div>
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
      </div>
    </PageContainer>
  )
}

export default ReconciliationPage
