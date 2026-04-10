import { useState, useEffect, useMemo, useCallback } from 'react'
import { STORAGE_KEYS, storageGet, storageSet } from '@/store/useAppStorage.js'
import { addHistoryItem } from '@/utils/history.js'
import {
  generateSettlementNumber,
  getNumberFormatFromStorage,
  isSettlementNumberUnique
} from '@/utils/settlementNumber.js'
import { CYCLE_TYPES, getCurrentCycle } from '@/utils/settlementCycle.js'
import { filterAndSortReconciliationRecords } from '@/domain/reconciliation/reconciliationFilters.js'
import { computeRecordsStatistics } from '@/domain/settlement/settlementSummary.js'
import { formatSettlementAmountString } from '@/domain/settlement/calculateSettlementAmount.js'
import { STATUS_OPTIONS } from '@/components/StatusManager.jsx'
import {
  buildFullDataBackupPayload,
  buildFilteredExportPayload,
  buildSelectedRecordsExportPayload,
  downloadJsonBlob
} from '@/domain/export/exportAdapters.js'

export function useReconciliationStore(settings, showToast) {
  const { partyA, partyB, settlementMonth, partners, deliveries, settlementNumberFormat } = settings

  const [records, setRecords] = useState([])
  const [channelRecords, setChannelRecords] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false)
  const [filterOptions, setFilterOptions] = useState({})
  const [sortOptions, setSortOptions] = useState({ field: '', order: 'desc' })
  const [quickFillData, setQuickFillData] = useState(null)
  const [lastSaveTime, setLastSaveTime] = useState(null)
  const [cycleType, setCycleType] = useState(CYCLE_TYPES.MONTHLY)
  const [selectedCycleKey, setSelectedCycleKey] = useState(null)

  useEffect(() => {
    const savedRecords = storageGet(STORAGE_KEYS.RECONCILIATION_RECORDS)
    if (savedRecords) {
      const withDefaults = savedRecords.map((r) => ({
        ...r,
        status: r.status || 'pending',
        settlementNumber:
          r.settlementNumber ||
          generateSettlementNumber(
            [],
            r.settlementMonth ? new Date(r.settlementMonth + '-01') : new Date(),
            getNumberFormatFromStorage(),
            r.partner
          )
      }))
      setRecords(withDefaults)
    }
    const savedChannel = storageGet(STORAGE_KEYS.CHANNEL_RECORDS)
    if (savedChannel) setChannelRecords(savedChannel)
    setCycleType(CYCLE_TYPES.MONTHLY)
  }, [])

  useEffect(() => {
    storageSet(STORAGE_KEYS.RECONCILIATION_RECORDS, records)
    setLastSaveTime(new Date())
  }, [records])

  useEffect(() => {
    storageSet(STORAGE_KEYS.CHANNEL_RECORDS, channelRecords)
  }, [channelRecords])

  const filteredRecords = useMemo(
    () =>
      filterAndSortReconciliationRecords({
        records,
        searchTerm,
        filterOptions,
        sortOptions,
        selectedCycleKey,
        cycleType
      }),
    [records, searchTerm, filterOptions, sortOptions, selectedCycleKey, cycleType]
  )

  const statistics = useMemo(() => computeRecordsStatistics(records), [records])

  const addRecord = useCallback(
    (record) => {
      const roundedStr = formatSettlementAmountString(record)
      const settlementNumber =
        record.settlementNumber ||
        generateSettlementNumber(
          records,
          record.settlementMonth ? new Date(record.settlementMonth + '-01') : new Date(),
          settlementNumberFormat,
          record.partner
        )
      const newRecords = [
        ...records,
        {
          ...record,
          id: Date.now(),
          settlementAmount: roundedStr,
          status: record.status || 'pending',
          settlementNumber
        }
      ]
      setRecords(newRecords)
      addHistoryItem('添加记录', { records: newRecords, partyA, partyB, settlementMonth })
      showToast(`记录添加成功！编号：${settlementNumber}`, 'success')
    },
    [records, partyA, partyB, settlementMonth, settlementNumberFormat, showToast]
  )

  const updateRecord = useCallback(
    (id, updatedRecord) => {
      if (updatedRecord.settlementNumber) {
        const isUnique = isSettlementNumberUnique(records, updatedRecord.settlementNumber, id)
        if (!isUnique) {
          showToast('结算单编号已存在，请使用其他编号', 'error')
          return false
        }
      }
      const roundedStr = formatSettlementAmountString(updatedRecord)
      setRecords(
        records.map((r) =>
          r.id === id ? { ...updatedRecord, id, settlementAmount: roundedStr } : r
        )
      )
      addHistoryItem('更新记录', { records, partyA, partyB, settlementMonth })
      showToast('记录更新成功！', 'success')
      return true
    },
    [records, partyA, partyB, settlementMonth, showToast]
  )

  const deleteRecord = useCallback((id) => {
    setDeleteId(id)
    setShowDeleteConfirm(true)
  }, [])

  const confirmDelete = useCallback(() => {
    if (deleteId) {
      const newRecords = records.filter((r) => r.id !== deleteId)
      setRecords(newRecords)
      addHistoryItem('删除记录', { records: newRecords, partyA, partyB, settlementMonth })
      showToast('记录已删除', 'success')
    }
    setShowDeleteConfirm(false)
    setDeleteId(null)
  }, [deleteId, records, partyA, partyB, settlementMonth, showToast])

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false)
    setDeleteId(null)
  }, [])

  const cancelBatchDelete = useCallback(() => {
    setShowBatchDeleteConfirm(false)
  }, [])

  const handleSelectAll = useCallback(
    (checked) => {
      if (checked) {
        setSelectedIds(filteredRecords.map((r) => r.id))
      } else {
        setSelectedIds([])
      }
    },
    [filteredRecords]
  )

  const handleSelectRecord = useCallback((id, checked) => {
    setSelectedIds((prev) => {
      if (checked) return [...prev, id]
      return prev.filter((selectedId) => selectedId !== id)
    })
  }, [])

  const handleBatchDelete = useCallback(() => {
    if (selectedIds.length === 0) {
      showToast('请先选择要删除的记录', 'error')
      return
    }
    setShowBatchDeleteConfirm(true)
  }, [selectedIds.length, showToast])

  const confirmBatchDelete = useCallback(() => {
    const n = selectedIds.length
    setRecords((prev) => prev.filter((r) => !selectedIds.includes(r.id)))
    setSelectedIds([])
    setShowBatchDeleteConfirm(false)
    showToast(`已删除 ${n} 条记录`, 'success')
  }, [selectedIds, showToast])

  const handleBatchUpdate = useCallback(
    (ids, updates) => {
      setRecords((prev) =>
        prev.map((r) => {
          if (ids.includes(r.id)) {
            const updated = { ...r, ...updates }
            const roundedStr = formatSettlementAmountString(updated)
            return { ...updated, settlementAmount: roundedStr }
          }
          return r
        })
      )
      setSelectedIds([])
      showToast(`已更新 ${ids.length} 条记录`, 'success')
    },
    [showToast]
  )

  const handleBatchStatusUpdate = useCallback(
    (ids, status) => {
      setRecords((prev) =>
        prev.map((r) => (ids.includes(r.id) ? { ...r, status } : r))
      )
      setSelectedIds([])
      const statusInfo = STATUS_OPTIONS.find((s) => s.value === status)
      showToast(`已将 ${ids.length} 条记录状态修改为"${statusInfo?.label || status}"`, 'success')
    },
    [showToast]
  )

  const handleStatusChange = useCallback(
    (id, newStatus) => {
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      )
      const statusInfo = STATUS_OPTIONS.find((s) => s.value === newStatus)
      showToast(`状态已修改为"${statusInfo?.label || newStatus}"`, 'success')
    },
    [showToast]
  )

  const handleCopyRecord = useCallback(
    (newRecord) => {
      const roundedStr = formatSettlementAmountString(newRecord)
      setRecords((prev) => [...prev, { ...newRecord, settlementAmount: roundedStr }])
      showToast('记录已复制', 'success')
    },
    [showToast]
  )

  const handleReorder = useCallback(
    (newRecords) => {
      setRecords(newRecords)
      showToast('记录顺序已调整', 'success')
    },
    [showToast]
  )

  const handleRestoreFromHistory = useCallback(
    (data) => {
      if (data.records) setRecords(data.records)
      if (data.partyA) settings.setPartyA(data.partyA)
      if (data.partyB) settings.setPartyB(data.partyB)
      if (data.settlementMonth) settings.setSettlementMonth(data.settlementMonth)
      showToast('历史状态已恢复', 'success')
    },
    [settings, showToast]
  )

  const handleApplyTemplate = useCallback(
    (template) => {
      showToast(`已应用模板：${template.name}`, 'success')
    },
    [showToast]
  )

  const handleLoadBill = useCallback(
    (billData) => {
      if (billData.records) setRecords(billData.records)
      if (billData.partyA) settings.setPartyA(billData.partyA)
      if (billData.partyB) settings.setPartyB(billData.partyB)
      if (billData.settlementMonth) settings.setSettlementMonth(billData.settlementMonth)
      showToast('账单加载成功！', 'success')
    },
    [settings, showToast]
  )

  const handleExcelImport = useCallback(
    (importedRecords) => {
      const newRecords = importedRecords.map((r) => ({
        ...r,
        id: Date.now() + Math.random()
      }))
      setRecords((prev) => [...prev, ...newRecords])
      showToast(`成功导入 ${importedRecords.length} 条记录！`, 'success')
    },
    [showToast]
  )

  const handleClearAll = useCallback(() => {
    setRecords([])
    showToast('所有记录已清空', 'success')
  }, [showToast])

  const handleExportAll = useCallback(() => {
    const data = buildFullDataBackupPayload({
      records,
      partyA,
      partyB,
      settlementMonth,
      partners,
      deliveries
    })
    downloadJsonBlob(data, `全部数据备份_${new Date().toISOString().split('T')[0]}.json`)
    showToast('数据导出成功！', 'success')
  }, [records, partyA, partyB, settlementMonth, partners, deliveries, showToast])

  const handleExportFiltered = useCallback(() => {
    if (filteredRecords.length === 0) {
      showToast('没有可导出的数据', 'error')
      return
    }
    const data = buildFilteredExportPayload({
      filteredRecords,
      partyA,
      partyB,
      settlementMonth,
      totalRecordsCount: records.length,
      searchTerm,
      filterOptions,
      sortOptions
    })
    downloadJsonBlob(data, `筛选结果_${new Date().toISOString().split('T')[0]}.json`)
    showToast(`成功导出 ${filteredRecords.length} 条筛选记录！`, 'success')
  }, [
    filteredRecords,
    partyA,
    partyB,
    settlementMonth,
    records.length,
    searchTerm,
    filterOptions,
    sortOptions,
    showToast
  ])

  const handleExportSelected = useCallback(() => {
    if (selectedIds.length === 0) {
      showToast('请先选择要导出的记录', 'error')
      return
    }
    const selectedRecords = records.filter((r) => selectedIds.includes(r.id))
    const data = buildSelectedRecordsExportPayload({
      selectedRecords,
      partyA,
      partyB,
      settlementMonth,
      selectedCount: selectedIds.length
    })
    downloadJsonBlob(
      data,
      `选中记录_${selectedIds.length}条_${new Date().toISOString().split('T')[0]}.json`
    )
    showToast(`成功导出 ${selectedIds.length} 条选中记录！`, 'success')
  }, [selectedIds, records, partyA, partyB, settlementMonth, showToast])

  const handleExportError = useCallback(
    (message = '导出失败，请稍后重试') => {
      showToast(message, 'error')
    },
    [showToast]
  )

  const onChannelAddRecord = useCallback(
    (record) => {
      const newRecord = { ...record, id: Date.now() }
      setChannelRecords((prev) => [...prev, newRecord])
      showToast('渠道记录添加成功', 'success')
    },
    [showToast]
  )

  const onChannelUpdateRecord = useCallback((id, record) => {
    setChannelRecords((prev) => prev.map((r) => (r.id === id ? { ...record, id } : r)))
    showToast('渠道记录更新成功', 'success')
  }, [showToast])

  const onChannelDeleteRecord = useCallback((id) => {
    setChannelRecords((prev) => prev.filter((r) => r.id !== id))
    showToast('渠道记录已删除', 'success')
  }, [showToast])

  const restoreFullData = useCallback(
    (data) => {
      if (data.records) setRecords(data.records)
      if (data.partyA) settings.setPartyA(data.partyA)
      if (data.partyB) settings.setPartyB(data.partyB)
      if (data.settlementMonth) settings.setSettlementMonth(data.settlementMonth)
      if (data.partners) settings.setPartners(data.partners)
      if (data.deliveries) settings.setDeliveries(data.deliveries)
    },
    [settings]
  )

  return {
    records,
    setRecords,
    channelRecords,
    searchTerm,
    setSearchTerm,
    showDeleteConfirm,
    setShowDeleteConfirm,
    deleteId,
    selectedIds,
    setSelectedIds,
    showBatchDeleteConfirm,
    setShowBatchDeleteConfirm,
    filterOptions,
    setFilterOptions,
    sortOptions,
    setSortOptions,
    quickFillData,
    setQuickFillData,
    lastSaveTime,
    filteredRecords,
    statistics,
    addRecord,
    updateRecord,
    deleteRecord,
    confirmDelete,
    cancelDelete,
    cancelBatchDelete,
    handleSelectAll,
    handleSelectRecord,
    handleBatchDelete,
    confirmBatchDelete,
    handleBatchUpdate,
    handleBatchStatusUpdate,
    handleStatusChange,
    handleCopyRecord,
    handleReorder,
    handleRestoreFromHistory,
    handleApplyTemplate,
    handleLoadBill,
    handleExcelImport,
    handleClearAll,
    handleExportAll,
    handleExportFiltered,
    handleExportSelected,
    handleExportError,
    onChannelAddRecord,
    onChannelUpdateRecord,
    onChannelDeleteRecord,
    restoreFullData,
    cycleType,
    setCycleType,
    selectedCycleKey,
    setSelectedCycleKey,
    CYCLE_TYPES,
    getCurrentCycle
  }
}
