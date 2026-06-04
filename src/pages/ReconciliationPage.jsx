import React, { useState, useEffect } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import PageContainer from '@/components/layout/PageContainer.jsx'
import SearchFilter from '@/components/SearchFilter.jsx'
import DataTable from '@/components/DataTable.jsx'
import BillExport from '@/components/BillExport.jsx'
import FilterSort from '@/components/FilterSort.jsx'
import BatchEdit from '@/components/BatchEdit.jsx'
import ExcelImport from '@/components/ExcelImport.jsx'
import SettlementCycleManager from '@/components/SettlementCycleManager.jsx'
import ReconciliationStatsCards from '@/components/reconciliation/ReconciliationStatsCards.jsx'
import ReconciliationToolbar from '@/components/reconciliation/ReconciliationToolbar.jsx'
import ReconciliationLightDrawer from '@/components/reconciliation/ReconciliationLightDrawer.jsx'
import ReconciliationRdPaymentsDrawer from '@/components/reconciliation/ReconciliationRdPaymentsDrawer.jsx'
import QuickSdkRdBillingTool from '@/components/reconciliation/QuickSdkRdBillingTool.jsx'
import '@/components/reconciliation/reconciliation-admin.css'
import { BatchStatusUpdate } from '@/components/StatusManager.jsx'
import { calculateSettlementAmount } from '@/domain/settlement/calculateSettlementAmount.js'
import { CYCLE_TYPES, getCurrentCycle } from '@/utils/settlementCycle.js'
import { VIEWS } from '@/app/routes.js'
import { getReconciliationRecordId } from '@/lib/api/reconciliation.ts'
import { consumeReconciliationFocus } from '@/lib/exceptions/navFocus.ts'

function ReconciliationPage({ variant = 'full' }) {
  const {
    recon,
    settings,
    showToast,
    setActiveView,
    openReconciliationEdit,
    navigateBankPaymentForReconciliation
  } = useAppState()
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
    updateRecord,
    deleteRecord,
    handleExportFiltered,
    handleExportSelected,
    handleExportError,
    handleExcelImport,
    statistics,
    setQuickFillData
  } = recon

  useEffect(() => {
    const id = consumeReconciliationFocus()
    if (id) setSearchTerm(id)
  }, [setSearchTerm])

  const { settlementMonth, partyA, partyB } = settings

  const [lightDrawerRecord, setLightDrawerRecord] = useState(null)
  const [rdPaymentsDrawer, setRdPaymentsDrawer] = useState({
    open: false,
    reconciliationId: '',
    statementNo: ''
  })

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
              handleBatchUpdate={handleBatchUpdate}
              handleBatchStatusUpdate={handleBatchStatusUpdate}
            />
          </div>

          {hasActiveFilters && (
            <div className="reconciliation-rd__filter-summary" role="status">
              <span>当前有筛选条件生效，显示 {filteredRecords.length} / {records.length} 条</span>
              <button
                type="button"
                className="reconciliation-rd__filter-summary-clear"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCycleKey(null)
                  setFilterOptions({})
                  setSortOptions({ field: '', order: 'desc' })
                  showToast('已清除搜索、周期与筛选', 'info')
                }}
              >
                清除筛选
              </button>
            </div>
          )}

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
              sortOptions={sortOptions}
              onSortChange={(field, order) => setSortOptions({ field, order })}
              onStatusChange={handleStatusChange}
              columnPreset="compact"
              useDrawerForEdit={false}
              showRdBankPaymentColumns
              onRdLinkPayment={(r) => {
                const id = getReconciliationRecordId(r)
                if (!id) {
                  showToast('该记录缺少主键 id，无法关联付款', 'error')
                  return
                }
                navigateBankPaymentForReconciliation(id)
              }}
              onRdViewPayments={(r) => {
                const id = getReconciliationRecordId(r)
                if (!id) return
                setRdPaymentsDrawer({
                  open: true,
                  reconciliationId: id,
                  statementNo: r.settlementNumber != null ? String(r.settlementNumber) : ''
                })
              }}
              onRequestPageEdit={(r) => {
                const id = getReconciliationRecordId(r)
                if (!id) {
                  showToast('该记录缺少主键 id，无法打开编辑页', 'error')
                  return
                }
                openReconciliationEdit(id)
              }}
              onQuickView={(r) => setLightDrawerRecord(r)}
            />
          </div>

          <QuickSdkRdBillingTool
            defaultMonth={settlementMonth}
            onNotify={(message, type) => showToast(message, type)}
            onCreateBill={(payload) => {
              setQuickFillData?.(payload)
              setActiveView(VIEWS.RECON_CREATE)
              showToast(`${payload.settlementMonth} QuickSDK 明细已带入新增账单`, 'success')
            }}
          />
        </div>

        <ReconciliationLightDrawer
          open={Boolean(lightDrawerRecord)}
          record={lightDrawerRecord}
          onClose={() => setLightDrawerRecord(null)}
          onStatusChange={handleStatusChange}
          onUpdateRecord={updateRecord}
          onNavigateToFullEdit={(id) => openReconciliationEdit(id != null ? String(id) : '')}
          onRdLinkPayment={(rec) => {
            const id = getReconciliationRecordId(rec)
            if (!id) {
              showToast('该记录缺少主键 id，无法关联付款', 'error')
              return
            }
            navigateBankPaymentForReconciliation(id)
            setLightDrawerRecord(null)
          }}
          onRdViewPayments={(rec) => {
            const id = getReconciliationRecordId(rec)
            if (!id) return
            setRdPaymentsDrawer({
              open: true,
              reconciliationId: id,
              statementNo: rec.settlementNumber != null ? String(rec.settlementNumber) : ''
            })
            setLightDrawerRecord(null)
          }}
        />

        <ReconciliationRdPaymentsDrawer
          open={rdPaymentsDrawer.open}
          reconciliationId={rdPaymentsDrawer.reconciliationId}
          statementNo={rdPaymentsDrawer.statementNo}
          onClose={() =>
            setRdPaymentsDrawer({ open: false, reconciliationId: '', statementNo: '' })
          }
        />

      </PageContainer>
    )
  }

  /* 对账总表：保留原结构（无右侧抽屉、表格全列）；主内容区须整行占满，避免沿用双列表栅格留下空白列 */
  return (
    <PageContainer hideHeader className="page-container--reconciliation-ledger">
      <div className="reconciliation-ledger-page">
      <div className="cycle-manager-section">{cycleBlock}</div>
      <div className="toolbar-section">
        <div className="toolbar-main">
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
        </div>
        <div className="toolbar-buttons">
          <BillExport
            records={records}
            partyA={partyA}
            partyB={partyB}
            settlementMonth={settlementMonth}
            statistics={statistics}
            onExportSuccess={(message) => showToast(message || '账单导出成功！', 'success')}
            onExportError={handleExportError}
            triggerLabel="导出账单"
            triggerTitle="导出当前列表中的全部记录（Excel / PDF / CSV），与「导出选中账单」不同"
            excelMenuLabel={'\uD83D\uDCCA \u5bfc\u51fa\u5f53\u524d\u9875\u8d26\u5355'}
            excelMenuTitle="将当前列表中的全部记录导出为一个 Excel 工作表（单张结算确认单）"
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
              导出筛选 ({filteredRecords.length})
            </button>
          )}
          <ExcelImport onImport={handleExcelImport} />
          {selectedIds.length > 0 && (
            <button
              type="button"
              className="export-selected-btn"
              onClick={handleExportSelected}
              title="仅导出当前勾选的研发对账记录（Excel）"
            >
              导出选中 ({selectedIds.length})
            </button>
          )}
          <button
            type="button"
            className="toolbar-backup-link"
            onClick={() => setActiveView(VIEWS.SETTINGS_BACKUP)}
            title="前往系统设置中的数据备份与恢复"
          >
            备份设置
          </button>
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
            sortOptions={sortOptions}
            onSortChange={(field, order) => setSortOptions({ field, order })}
            onStatusChange={handleStatusChange}
            showRdBankPaymentColumns
            onRdLinkPayment={(r) => {
              const id = getReconciliationRecordId(r)
              if (!id) {
                showToast('该记录缺少主键 id，无法关联付款', 'error')
                return
              }
              navigateBankPaymentForReconciliation(id)
            }}
            onRdViewPayments={(r) => {
              const id = getReconciliationRecordId(r)
              if (!id) return
              setRdPaymentsDrawer({
                open: true,
                reconciliationId: id,
                statementNo: r.settlementNumber != null ? String(r.settlementNumber) : ''
              })
            }}
          />
        </div>
      </div>
      </div>
      <ReconciliationRdPaymentsDrawer
        open={rdPaymentsDrawer.open}
        reconciliationId={rdPaymentsDrawer.reconciliationId}
        statementNo={rdPaymentsDrawer.statementNo}
        onClose={() =>
          setRdPaymentsDrawer({ open: false, reconciliationId: '', statementNo: '' })
        }
      />
    </PageContainer>
  )
}

export default ReconciliationPage
