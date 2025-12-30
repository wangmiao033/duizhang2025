import React, { useState, useEffect, useMemo } from 'react'
import './App.css'
import DataForm from './components/DataForm.jsx'
import DataTable from './components/DataTable.jsx'
import SummaryCard from './components/SummaryCard.jsx'
import ExportButton from './components/ExportButton.jsx'
import CompanyInfo from './components/CompanyInfo.jsx'
import ConfirmDialog from './components/ConfirmDialog.jsx'
import Toast from './components/Toast.jsx'
import SearchFilter from './components/SearchFilter.jsx'
import DataBackup from './components/DataBackup.jsx'
import BillManager from './components/BillManager.jsx'
import StatisticsChart from './components/StatisticsChart.jsx'
import PrintButton from './components/PrintButton.jsx'
import ExcelImport from './components/ExcelImport.jsx'
import HelpTooltip from './components/HelpTooltip.jsx'
import FilterSort from './components/FilterSort.jsx'
import BatchEdit from './components/BatchEdit.jsx'
import CopyRecord from './components/CopyRecord.jsx'
import DataValidator from './components/DataValidator.jsx'
import HistoryPanel from './components/HistoryPanel.jsx'
import TemplatePresets from './components/TemplatePresets.jsx'
import CSVExport from './components/CSVExport.jsx'
import StatisticsReport from './components/StatisticsReport.jsx'
import DataComparison from './components/DataComparison.jsx'
import Settings from './components/Settings.jsx'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js'
import { addHistoryItem } from './utils/history.js'

function App() {
  const [records, setRecords] = useState([])
  const [partyA, setPartyA] = useState({
    invoiceTitle: '厦门巴掌互动科技有限公司',
    invoiceContent: '*信息系统服务*信息服务费',
    taxRegistrationNo: '91350203MA348H8D3Y',
    invoiceAddress: '厦门市软件园三期凤岐路199-1号1003单元',
    bankName: '兴业银行厦门集美支行',
    bankAccount: '129980100100171131',
    phone: '0592-6219126'
  })
  const [partyB, setPartyB] = useState({
    companyName: '广州能动科技有限公司',
    bankName: '中国工商银行股份有限公司广州兴华支行',
    bankAccount: '3602841509200157769'
  })
  const [settlementMonth, setSettlementMonth] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' })
  const [selectedIds, setSelectedIds] = useState([])
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false)
  const [filterOptions, setFilterOptions] = useState({})
  const [sortOptions, setSortOptions] = useState({ field: '', order: 'desc' })

  // 从localStorage加载数据
  useEffect(() => {
    const savedRecords = localStorage.getItem('reconciliationRecords')
    const savedPartyA = localStorage.getItem('partyA')
    const savedPartyB = localStorage.getItem('partyB')
    const savedMonth = localStorage.getItem('settlementMonth')
    
    if (savedRecords) setRecords(JSON.parse(savedRecords))
    if (savedPartyA) setPartyA(JSON.parse(savedPartyA))
    if (savedPartyB) setPartyB(JSON.parse(savedPartyB))
    if (savedMonth) setSettlementMonth(savedMonth)
  }, [])

  // 保存数据到localStorage
  useEffect(() => {
    localStorage.setItem('reconciliationRecords', JSON.stringify(records))
  }, [records])

  useEffect(() => {
    localStorage.setItem('partyA', JSON.stringify(partyA))
  }, [partyA])

  useEffect(() => {
    localStorage.setItem('partyB', JSON.stringify(partyB))
  }, [partyB])

  useEffect(() => {
    localStorage.setItem('settlementMonth', settlementMonth)
  }, [settlementMonth])

  // 计算结算金额
  const calculateSettlementAmount = (record) => {
    const gameFlow = parseFloat(record.gameFlow || 0)
    const testingFee = parseFloat(record.testingFee || 0)
    const voucher = parseFloat(record.voucher || 0)
    const channelFeeRate = parseFloat(record.channelFeeRate || 0) / 100
    const taxPoint = parseFloat(record.taxPoint || 0) / 100
    const revenueShareRatio = parseFloat(record.revenueShareRatio || 0) / 100
    const discount = parseFloat(record.discount || 0)
    const refund = parseFloat(record.refund || 0)

    // 结算金额 = (游戏流水 - 测试费 - 代金券) * (1 - 通道费率) * (1 - 税点) * 分成比例 * 折扣 - 退款
    const baseAmount = gameFlow - testingFee - voucher
    const afterChannelFee = baseAmount * (1 - channelFeeRate)
    const afterTax = afterChannelFee * (1 - taxPoint)
    const afterShare = afterTax * revenueShareRatio
    const afterDiscount = afterShare * discount
    const finalAmount = afterDiscount - refund

    return Math.max(0, finalAmount)
  }

  const addRecord = (record) => {
    const settlementAmount = calculateSettlementAmount(record)
    const newRecords = [...records, { 
      ...record, 
      id: Date.now(),
      settlementAmount: settlementAmount.toFixed(2)
    }]
    setRecords(newRecords)
    addHistoryItem('添加记录', { records: newRecords, partyA, partyB, settlementMonth })
    showToast('记录添加成功！', 'success')
  }

  const updateRecord = (id, updatedRecord) => {
    const settlementAmount = calculateSettlementAmount(updatedRecord)
    setRecords(records.map(r => 
      r.id === id 
        ? { ...updatedRecord, id, settlementAmount: settlementAmount.toFixed(2) }
        : r
    ))
  }

  const deleteRecord = (id) => {
    setDeleteId(id)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    if (deleteId) {
      const newRecords = records.filter(r => r.id !== deleteId)
      setRecords(newRecords)
      addHistoryItem('删除记录', { records: newRecords, partyA, partyB, settlementMonth })
      showToast('记录已删除', 'success')
    }
    setShowDeleteConfirm(false)
    setDeleteId(null)
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(filteredRecords.map(r => r.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectRecord = (id, checked) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id))
    }
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) {
      showToast('请先选择要删除的记录', 'error')
      return
    }
    setShowBatchDeleteConfirm(true)
  }

  const confirmBatchDelete = () => {
    setRecords(records.filter(r => !selectedIds.includes(r.id)))
    setSelectedIds([])
    setShowBatchDeleteConfirm(false)
    showToast(`已删除 ${selectedIds.length} 条记录`, 'success')
  }

  const handleBatchUpdate = (ids, updates) => {
    setRecords(records.map(r => {
      if (ids.includes(r.id)) {
        const updated = { ...r, ...updates }
        // 重新计算结算金额
        const settlementAmount = calculateSettlementAmount(updated)
        return { ...updated, settlementAmount: settlementAmount.toFixed(2) }
      }
      return r
    }))
    setSelectedIds([])
    showToast(`已更新 ${ids.length} 条记录`, 'success')
  }

  const handleCopyRecord = (newRecord) => {
    const settlementAmount = calculateSettlementAmount(newRecord)
    setRecords([...records, { ...newRecord, settlementAmount: settlementAmount.toFixed(2) }])
    showToast('记录已复制', 'success')
  }

  const handleRestoreFromHistory = (data) => {
    if (data.records) setRecords(data.records)
    if (data.partyA) setPartyA(data.partyA)
    if (data.partyB) setPartyB(data.partyB)
    if (data.settlementMonth) setSettlementMonth(data.settlementMonth)
    showToast('历史状态已恢复', 'success')
  }

  const handleApplyTemplate = (template) => {
    // 将模板应用到表单默认值
    showToast(`已应用模板：${template.name}`, 'success')
    // 可以在这里更新表单的默认值
  }

  const handleLoadBill = (billData) => {
    if (billData.records) setRecords(billData.records)
    if (billData.partyA) setPartyA(billData.partyA)
    if (billData.partyB) setPartyB(billData.partyB)
    if (billData.settlementMonth) setSettlementMonth(billData.settlementMonth)
    showToast('账单加载成功！', 'success')
  }

  const handleExcelImport = (importedRecords) => {
    // 合并导入的记录，避免ID冲突
    const newRecords = importedRecords.map(r => ({
      ...r,
      id: Date.now() + Math.random()
    }))
    setRecords([...records, ...newRecords])
    showToast(`成功导入 ${importedRecords.length} 条记录！`, 'success')
  }

  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type })
  }

  const hideToast = () => {
    setToast({ ...toast, isVisible: false })
  }

  // 筛选和排序记录
  const filteredRecords = useMemo(() => {
    let result = [...records]

    // 搜索筛选
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(record => 
        (record.game && record.game.toLowerCase().includes(term)) ||
        (record.partner && record.partner.toLowerCase().includes(term)) ||
        (record.settlementMonth && record.settlementMonth.toLowerCase().includes(term))
      )
    }

    // 高级筛选
    if (filterOptions.partner) {
      result = result.filter(r => r.partner && r.partner.includes(filterOptions.partner))
    }
    if (filterOptions.game) {
      result = result.filter(r => r.game && r.game.includes(filterOptions.game))
    }
    if (filterOptions.minAmount) {
      const min = parseFloat(filterOptions.minAmount)
      result = result.filter(r => parseFloat(r.settlementAmount || 0) >= min)
    }
    if (filterOptions.maxAmount) {
      const max = parseFloat(filterOptions.maxAmount)
      result = result.filter(r => parseFloat(r.settlementAmount || 0) <= max)
    }

    // 排序
    if (sortOptions.field) {
      result.sort((a, b) => {
        let aVal, bVal
        switch (sortOptions.field) {
          case 'gameFlow':
            aVal = parseFloat(a.gameFlow || 0)
            bVal = parseFloat(b.gameFlow || 0)
            break
          case 'settlementAmount':
            aVal = parseFloat(a.settlementAmount || 0)
            bVal = parseFloat(b.settlementAmount || 0)
            break
          case 'game':
            aVal = (a.game || '').toLowerCase()
            bVal = (b.game || '').toLowerCase()
            break
          case 'partner':
            aVal = (a.partner || '').toLowerCase()
            bVal = (b.partner || '').toLowerCase()
            break
          default:
            return 0
        }

        if (sortOptions.field === 'game' || sortOptions.field === 'partner') {
          return sortOptions.order === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal)
        } else {
          return sortOptions.order === 'asc' 
            ? aVal - bVal
            : bVal - aVal
        }
      })
    }

    return result
  }, [records, searchTerm, filterOptions, sortOptions])

  // 计算统计数据（使用useMemo优化）
  const statistics = useMemo(() => {
    return {
      totalGameFlow: records.reduce((sum, r) => sum + (parseFloat(r.gameFlow) || 0), 0),
      totalTestingFee: records.reduce((sum, r) => sum + (parseFloat(r.testingFee) || 0), 0),
      totalVoucher: records.reduce((sum, r) => sum + (parseFloat(r.voucher) || 0), 0),
      totalSettlementAmount: records.reduce((sum, r) => sum + (parseFloat(r.settlementAmount) || 0), 0)
    }
  }, [records])

  // 快捷键支持
  useKeyboardShortcuts({
    'ctrl+s': (e) => {
      e?.preventDefault()
      // 可以添加保存快捷键
    },
    'ctrl+f': (e) => {
      e?.preventDefault()
      // 聚焦搜索框
      const searchInput = document.querySelector('.search-input')
      if (searchInput) searchInput.focus()
    },
    'ctrl+p': (e) => {
      e?.preventDefault()
      // 打印功能
      if (records.length > 0) {
        const printBtn = document.querySelector('.print-btn')
        if (printBtn) printBtn.click()
      }
    }
  })

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>对账管理系统</h1>
            <p>生成标准格式的对账单</p>
          </div>
          <div className="header-actions">
            <Settings onSettingsChange={(settings) => {
              // 可以在这里应用设置
              console.log('设置已更新', settings)
            }} />
            <HelpTooltip />
          </div>
        </div>
      </header>

      <div className="app-container">
        <div className="config-section">
          <div className="config-item">
            <label>结算月份：</label>
            <input
              type="text"
              value={settlementMonth}
              onChange={(e) => setSettlementMonth(e.target.value)}
              placeholder="如：2025年9月"
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', width: '200px' }}
            />
          </div>
        </div>

        <div className="summary-section">
          <SummaryCard title="记录总数" value={records.length} icon="📋" />
          <SummaryCard title="游戏流水总额" value={`¥${statistics.totalGameFlow.toFixed(2)}`} icon="💰" />
          <SummaryCard title="代金券总额" value={`¥${statistics.totalVoucher.toFixed(2)}`} icon="🎫" />
          <SummaryCard title="结算金额总额" value={`¥${statistics.totalSettlementAmount.toFixed(2)}`} icon="💵" />
        </div>

        <div className="toolbar-section">
          <SearchFilter 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm}
            resultCount={filteredRecords.length}
            totalCount={records.length}
          />
          <div className="toolbar-buttons">
            <FilterSort
              onFilterChange={setFilterOptions}
              onSortChange={(field, order) => setSortOptions({ field, order })}
            />
            <HistoryPanel onRestore={handleRestoreFromHistory} />
            <ExcelImport onImport={handleExcelImport} />
            <DataBackup 
              records={records}
              partyA={partyA}
              partyB={partyB}
              settlementMonth={settlementMonth}
              onImport={(data) => {
                if (data.records) setRecords(data.records)
                if (data.partyA) setPartyA(data.partyA)
                if (data.partyB) setPartyB(data.partyB)
                if (data.settlementMonth) setSettlementMonth(data.settlementMonth)
                showToast('数据导入成功！', 'success')
              }}
            />
          </div>
        </div>

        <div className="validator-section">
          <DataValidator records={records} />
        </div>

        <div className="statistics-section">
          <StatisticsChart records={records} />
        </div>

        <div className="report-section">
          <StatisticsReport records={records} />
        </div>

        <div className="comparison-section">
          <DataComparison records={records} />
        </div>

        <div className="main-content">
          <div className="form-section">
            <div className="form-header">
              <h3>添加对账记录</h3>
              <TemplatePresets onApplyTemplate={handleApplyTemplate} />
            </div>
            <DataForm
              onAddRecord={addRecord}
              settlementMonth={settlementMonth}
              onError={(msg) => showToast(msg, 'error')}
            />
          </div>

          <div className="table-section">
            <div className="table-actions">
              {selectedIds.length > 0 && (
                <BatchEdit
                  selectedIds={selectedIds}
                  records={records}
                  onBatchUpdate={handleBatchUpdate}
                />
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
            />
          </div>
        </div>

        <div className="company-info-section">
          <CompanyInfo
            partyA={partyA}
            partyB={partyB}
            onUpdatePartyA={setPartyA}
            onUpdatePartyB={setPartyB}
          />
        </div>

        <div className="bill-manager-section">
          <BillManager
            records={records}
            partyA={partyA}
            partyB={partyB}
            settlementMonth={settlementMonth}
            onLoadBill={handleLoadBill}
          />
        </div>

        <div className="export-section">
          <div className="export-buttons">
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
            />
            <CSVExport
              records={records}
              statistics={statistics}
            />
            <PrintButton
              records={records}
              partyA={partyA}
              partyB={partyB}
              settlementMonth={settlementMonth}
              statistics={statistics}
            />
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="确认删除"
        message="确定要删除这条记录吗？此操作无法撤销。"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setDeleteId(null)
        }}
        confirmText="删除"
        cancelText="取消"
      />

      <ConfirmDialog
        isOpen={showBatchDeleteConfirm}
        title="确认批量删除"
        message={`确定要删除选中的 ${selectedIds.length} 条记录吗？此操作无法撤销。`}
        onConfirm={confirmBatchDelete}
        onCancel={() => setShowBatchDeleteConfirm(false)}
        confirmText="删除"
        cancelText="取消"
      />

      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </div>
  )
}

export default App

