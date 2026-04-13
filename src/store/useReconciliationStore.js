import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
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
import {
  listReconciliationRecords,
  createReconciliationRecord,
  updateReconciliationRecord,
  deleteReconciliationRecord,
  apiRowToFrontend,
  frontendRecordToApiPayload
} from '@/lib/api/reconciliation.ts'
import {
  listChannelRecords,
  createChannelRecord,
  updateChannelRecord,
  deleteChannelRecord,
  apiChannelRowToFrontend,
  frontendChannelRecordToPayload
} from '@/lib/api/channel.ts'

function normalizeLocalChannelRecords(saved) {
  return (saved || []).map((r) => ({
    ...r,
    id: r.id != null ? String(r.id) : String(Date.now()),
    status: r.status || 'pending'
  }))
}

function normalizeLocalReconciliationRecords(savedRecords) {
  return savedRecords.map((r) => ({
    ...r,
    id: r.id != null ? String(r.id) : String(Date.now()),
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
}

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
  const [reconciliationApiEnabled, setReconciliationApiEnabled] = useState(false)
  const [channelApiEnabled, setChannelApiEnabled] = useState(false)

  const showToastRef = useRef(showToast)
  showToastRef.current = showToast

  const refetchReconciliationFromApi = useCallback(async () => {
    const { items } = await listReconciliationRecords({ limit: 500, offset: 0 })
    setRecords(items.map(apiRowToFrontend))
  }, [])

  const refetchChannelFromApi = useCallback(async () => {
    const { items } = await listChannelRecords({ limit: 500, offset: 0 })
    setChannelRecords(items.map(apiChannelRowToFrontend))
  }, [])

  useEffect(() => {
    setCycleType(CYCLE_TYPES.MONTHLY)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { items } = await listReconciliationRecords({ limit: 500, offset: 0 })
        if (cancelled) return
        setRecords(items.map(apiRowToFrontend))
        setReconciliationApiEnabled(true)
      } catch (err) {
        console.error(err)
        if (cancelled) return
        showToastRef.current?.(
          '研发对账服务器暂时异常，已回退本地缓存。若列表长期不同步，请检查 API 与 Neon。',
          'error'
        )
        const savedRecords = storageGet(STORAGE_KEYS.RECONCILIATION_RECORDS)
        if (savedRecords) {
          setRecords(normalizeLocalReconciliationRecords(savedRecords))
        }
        setReconciliationApiEnabled(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { items } = await listChannelRecords({ limit: 500, offset: 0 })
        if (cancelled) return
        setChannelRecords(items.map(apiChannelRowToFrontend))
        setChannelApiEnabled(true)
      } catch (err) {
        console.error(err)
        if (cancelled) return
        showToastRef.current?.(
          '渠道服务器暂时异常，已回退本地缓存。若列表长期不同步，请检查 API 与 Neon 表 channel_records。',
          'error'
        )
        const savedChannel = storageGet(STORAGE_KEYS.CHANNEL_RECORDS)
        if (savedChannel?.length) {
          setChannelRecords(normalizeLocalChannelRecords(savedChannel))
        }
        setChannelApiEnabled(false)
      }
    })()
    return () => {
      cancelled = true
    }
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
    async (record) => {
      const roundedStr = formatSettlementAmountString(record)
      const settlementNumber =
        record.settlementNumber ||
        generateSettlementNumber(
          records,
          record.settlementMonth ? new Date(record.settlementMonth + '-01') : new Date(),
          settlementNumberFormat,
          record.partner
        )
      const merged = {
        ...record,
        settlementAmount: roundedStr,
        status: record.status || 'pending',
        settlementNumber
      }

      if (reconciliationApiEnabled) {
        try {
          const created = await createReconciliationRecord(frontendRecordToApiPayload(merged))
          const fe = apiRowToFrontend(created)
          setRecords((prev) => [...prev, fe])
          addHistoryItem('添加记录', { records: [...records, fe], partyA, partyB, settlementMonth })
          showToast(`记录添加成功！编号：${settlementNumber}`, 'success')
          return
        } catch (e) {
          console.error(e)
          showToast('保存到服务器失败，请稍后重试', 'error')
          throw e
        }
      }

      const newRecords = [
        ...records,
        {
          ...merged,
          id: String(Date.now())
        }
      ]
      setRecords(newRecords)
      addHistoryItem('添加记录', { records: newRecords, partyA, partyB, settlementMonth })
      showToast(`记录添加成功！编号：${settlementNumber}`, 'success')
    },
    [records, partyA, partyB, settlementMonth, settlementNumberFormat, showToast, reconciliationApiEnabled]
  )

  const updateRecord = useCallback(
    async (id, updatedRecord) => {
      const sid = String(id)
      if (updatedRecord.settlementNumber) {
        const isUnique = isSettlementNumberUnique(records, updatedRecord.settlementNumber, sid)
        if (!isUnique) {
          showToast('结算单编号已存在，请使用其他编号', 'error')
          return false
        }
      }
      const roundedStr = formatSettlementAmountString(updatedRecord)
      const merged = { ...updatedRecord, id: sid, settlementAmount: roundedStr }

      if (reconciliationApiEnabled) {
        try {
          await updateReconciliationRecord(sid, frontendRecordToApiPayload(merged))
          await refetchReconciliationFromApi()
          addHistoryItem('更新记录', { records, partyA, partyB, settlementMonth })
          showToast('记录更新成功！', 'success')
          return true
        } catch (e) {
          console.error(e)
          showToast('更新服务器失败，请稍后重试', 'error')
          return false
        }
      }

      setRecords(
        records.map((r) => (String(r.id) === sid ? { ...merged, id: sid } : r))
      )
      addHistoryItem('更新记录', { records, partyA, partyB, settlementMonth })
      showToast('记录更新成功！', 'success')
      return true
    },
    [records, partyA, partyB, settlementMonth, showToast, reconciliationApiEnabled, refetchReconciliationFromApi]
  )

  const deleteRecord = useCallback((id) => {
    setDeleteId(id)
    setShowDeleteConfirm(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    const target = deleteId
    if (target) {
      const sid = String(target)
      if (reconciliationApiEnabled) {
        try {
          await deleteReconciliationRecord(sid)
          await refetchReconciliationFromApi()
        } catch (e) {
          console.error(e)
          showToast('从服务器删除失败，请稍后重试', 'error')
          setShowDeleteConfirm(false)
          setDeleteId(null)
          return
        }
      } else {
        const newRecords = records.filter((r) => String(r.id) !== sid)
        setRecords(newRecords)
      }
      addHistoryItem('删除记录', { records, partyA, partyB, settlementMonth })
      showToast('记录已删除', 'success')
    }
    setShowDeleteConfirm(false)
    setDeleteId(null)
  }, [
    deleteId,
    records,
    partyA,
    partyB,
    settlementMonth,
    showToast,
    reconciliationApiEnabled,
    refetchReconciliationFromApi
  ])

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
        setSelectedIds(filteredRecords.map((r) => String(r.id)))
      } else {
        setSelectedIds([])
      }
    },
    [filteredRecords]
  )

  const handleSelectRecord = useCallback((id, checked) => {
    setSelectedIds((prev) => {
      if (checked) return [...prev, id]
      return prev.filter((selectedId) => String(selectedId) !== String(id))
    })
  }, [])

  const handleBatchDelete = useCallback(() => {
    if (selectedIds.length === 0) {
      showToast('请先选择要删除的记录', 'error')
      return
    }
    setShowBatchDeleteConfirm(true)
  }, [selectedIds.length, showToast])

  const confirmBatchDelete = useCallback(async () => {
    const ids = [...selectedIds]
    const n = ids.length
    if (reconciliationApiEnabled) {
      try {
        for (const rawId of ids) {
          await deleteReconciliationRecord(String(rawId))
        }
        await refetchReconciliationFromApi()
      } catch (e) {
        console.error(e)
        showToast('批量删除未能全部完成，请稍后重试', 'error')
        setShowBatchDeleteConfirm(false)
        return
      }
    } else {
      setRecords((prev) => prev.filter((r) => !ids.some((i) => String(i) === String(r.id))))
    }
    setSelectedIds([])
    setShowBatchDeleteConfirm(false)
    showToast(`已删除 ${n} 条记录`, 'success')
  }, [selectedIds, showToast, reconciliationApiEnabled, refetchReconciliationFromApi])

  const handleBatchUpdate = useCallback(
    async (ids, updates) => {
      if (reconciliationApiEnabled) {
        try {
          for (const rawId of ids) {
            const r = records.find((x) => String(x.id) === String(rawId))
            if (!r) continue
            const updated = { ...r, ...updates }
            const roundedStr = formatSettlementAmountString(updated)
            const merged = { ...updated, settlementAmount: roundedStr }
            await updateReconciliationRecord(String(rawId), frontendRecordToApiPayload(merged))
          }
          await refetchReconciliationFromApi()
        } catch (e) {
          console.error(e)
          showToast('批量更新服务器失败', 'error')
          return
        }
      } else {
        setRecords((prev) =>
          prev.map((r) => {
            if (ids.some((i) => String(i) === String(r.id))) {
              const updated = { ...r, ...updates }
              const roundedStr = formatSettlementAmountString(updated)
              return { ...updated, settlementAmount: roundedStr }
            }
            return r
          })
        )
      }
      setSelectedIds([])
      showToast(`已更新 ${ids.length} 条记录`, 'success')
    },
    [records, showToast, reconciliationApiEnabled, refetchReconciliationFromApi]
  )

  const handleBatchStatusUpdate = useCallback(
    async (ids, status) => {
      if (reconciliationApiEnabled) {
        try {
          for (const rawId of ids) {
            const r = records.find((x) => String(x.id) === String(rawId))
            if (!r) continue
            const updated = { ...r, status }
            const roundedStr = formatSettlementAmountString(updated)
            await updateReconciliationRecord(
              String(rawId),
              frontendRecordToApiPayload({ ...updated, settlementAmount: roundedStr })
            )
          }
          await refetchReconciliationFromApi()
        } catch (e) {
          console.error(e)
          showToast('批量修改状态失败', 'error')
          return
        }
      } else {
        setRecords((prev) =>
          prev.map((r) => (ids.some((i) => String(i) === String(r.id)) ? { ...r, status } : r))
        )
      }
      setSelectedIds([])
      const statusInfo = STATUS_OPTIONS.find((s) => s.value === status)
      showToast(`已将 ${ids.length} 条记录状态修改为"${statusInfo?.label || status}"`, 'success')
    },
    [records, showToast, reconciliationApiEnabled, refetchReconciliationFromApi]
  )

  const handleStatusChange = useCallback(
    async (id, newStatus) => {
      const sid = String(id)
      const prevRow = records.find((r) => String(r.id) === sid)
      if (!prevRow) return

      if (reconciliationApiEnabled) {
        try {
          const updated = { ...prevRow, status: newStatus }
          const roundedStr = formatSettlementAmountString(updated)
          await updateReconciliationRecord(
            sid,
            frontendRecordToApiPayload({ ...updated, settlementAmount: roundedStr })
          )
          await refetchReconciliationFromApi()
        } catch (e) {
          console.error(e)
          showToast('状态同步失败', 'error')
          return
        }
      } else {
        setRecords((prev) =>
          prev.map((r) => (String(r.id) === sid ? { ...r, status: newStatus } : r))
        )
      }
      const statusInfo = STATUS_OPTIONS.find((s) => s.value === newStatus)
      showToast(`状态已修改为"${statusInfo?.label || newStatus}"`, 'success')
    },
    [records, showToast, reconciliationApiEnabled, refetchReconciliationFromApi]
  )

  const handleCopyRecord = useCallback(
    async (newRecord) => {
      const roundedStr = formatSettlementAmountString(newRecord)
      const settlementNumber = generateSettlementNumber(
        records,
        newRecord.settlementMonth ? new Date(newRecord.settlementMonth + '-01') : new Date(),
        settlementNumberFormat,
        newRecord.partner
      )
      const merged = {
        ...newRecord,
        settlementAmount: roundedStr,
        settlementNumber,
        status: newRecord.status || 'pending'
      }

      if (reconciliationApiEnabled) {
        try {
          await createReconciliationRecord(frontendRecordToApiPayload(merged))
          await refetchReconciliationFromApi()
          showToast('记录已复制', 'success')
          return
        } catch (e) {
          console.error(e)
          showToast('复制到服务器失败', 'error')
          return
        }
      }

      setRecords((prev) => [...prev, { ...merged, id: String(Date.now()) }])
      showToast('记录已复制', 'success')
    },
    [records, settlementNumberFormat, showToast, reconciliationApiEnabled, refetchReconciliationFromApi]
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
    async (importedRecords) => {
      if (reconciliationApiEnabled) {
        try {
          for (const r of importedRecords) {
            const withNum = {
              ...r,
              settlementNumber:
                r.settlementNumber ||
                generateSettlementNumber(
                  records,
                  r.settlementMonth ? new Date(r.settlementMonth + '-01') : new Date(),
                  settlementNumberFormat,
                  r.partner
                )
            }
            const roundedStr = formatSettlementAmountString(withNum)
            const merged = { ...withNum, settlementAmount: roundedStr, status: r.status || 'pending' }
            await createReconciliationRecord(frontendRecordToApiPayload(merged))
          }
          await refetchReconciliationFromApi()
          showToast(`成功导入 ${importedRecords.length} 条记录！`, 'success')
          return
        } catch (e) {
          console.error(e)
          showToast('导入同步服务器失败', 'error')
          return
        }
      }

      const newRecords = importedRecords.map((r) => ({
        ...r,
        id: String(Date.now() + Math.random())
      }))
      setRecords((prev) => [...prev, ...newRecords])
      showToast(`成功导入 ${importedRecords.length} 条记录！`, 'success')
    },
    [showToast, reconciliationApiEnabled, records, settlementNumberFormat, refetchReconciliationFromApi]
  )

  const handleClearAll = useCallback(() => {
    setRecords([])
    showToast(
      reconciliationApiEnabled
        ? '已清空当前列表视图；刷新页面将从服务器重新加载'
        : '所有记录已清空',
      'success'
    )
  }, [showToast, reconciliationApiEnabled])

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
    const selectedRecords = records.filter((r) => selectedIds.some((i) => String(i) === String(r.id)))
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
    async (record) => {
      const merged = { ...record, status: record.status || 'pending' }
      if (channelApiEnabled) {
        try {
          const created = await createChannelRecord(frontendChannelRecordToPayload(merged))
          const fe = apiChannelRowToFrontend(created)
          setChannelRecords((prev) => [...prev, fe])
          showToast('渠道记录添加成功', 'success')
          return
        } catch (e) {
          console.error(e)
          showToast('渠道记录保存到服务器失败', 'error')
          throw e
        }
      }
      const newRecord = { ...merged, id: String(Date.now()) }
      setChannelRecords((prev) => [...prev, newRecord])
      showToast('渠道记录添加成功', 'success')
    },
    [showToast, channelApiEnabled]
  )

  const onChannelAddRecordsBatch = useCallback(
    async (batch) => {
      if (!batch || batch.length === 0) return
      if (channelApiEnabled) {
        try {
          for (const r of batch) {
            const merged = { ...r, status: r.status || 'pending' }
            await createChannelRecord(frontendChannelRecordToPayload(merged))
          }
          await refetchChannelFromApi()
          showToast(`已批量添加 ${batch.length} 条渠道记录`, 'success')
          return
        } catch (e) {
          console.error(e)
          showToast('批量导入同步服务器失败', 'error')
          return
        }
      }
      const base = Date.now()
      const withIds = batch.map((r, i) => ({ ...r, id: String(base + i) }))
      setChannelRecords((prev) => [...prev, ...withIds])
      showToast(`已批量添加 ${withIds.length} 条渠道记录`, 'success')
    },
    [showToast, channelApiEnabled, refetchChannelFromApi]
  )

  const onChannelUpdateRecord = useCallback(
    async (id, record) => {
      const sid = String(id)
      const merged = { ...record, id: sid, status: record.status || 'pending' }
      if (channelApiEnabled) {
        try {
          await updateChannelRecord(sid, frontendChannelRecordToPayload(merged))
          await refetchChannelFromApi()
          showToast('渠道记录更新成功', 'success')
          return
        } catch (e) {
          console.error(e)
          showToast('渠道记录更新服务器失败', 'error')
          return
        }
      }
      setChannelRecords((prev) => prev.map((r) => (String(r.id) === sid ? { ...merged, id: sid } : r)))
      showToast('渠道记录更新成功', 'success')
    },
    [showToast, channelApiEnabled, refetchChannelFromApi]
  )

  const onChannelDeleteRecord = useCallback(
    async (rawId) => {
      const sid = String(rawId)
      if (channelApiEnabled) {
        try {
          await deleteChannelRecord(sid)
          await refetchChannelFromApi()
        } catch (e) {
          console.error(e)
          showToast('从服务器删除渠道记录失败', 'error')
          return
        }
      } else {
        setChannelRecords((prev) => prev.filter((r) => String(r.id) !== sid))
      }
      showToast('渠道记录已删除', 'success')
    },
    [showToast, channelApiEnabled, refetchChannelFromApi]
  )

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
    channelApiEnabled,
    reconciliationApiEnabled,
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
    onChannelAddRecordsBatch,
    onChannelUpdateRecord,
    onChannelDeleteRecord,
    restoreFullData,
    cycleType,
    setCycleType,
    selectedCycleKey,
    setSelectedCycleKey,
    CYCLE_TYPES,
    getCurrentCycle,
    refetchReconciliationFromApi
  }
}
