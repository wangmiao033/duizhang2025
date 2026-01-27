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
import GamePresets from './components/GamePresets.jsx'
import CSVExport from './components/CSVExport.jsx'
import StatisticsReport from './components/StatisticsReport.jsx'
import DataComparison from './components/DataComparison.jsx'
import Settings from './components/Settings.jsx'
import UserGuide from './components/UserGuide.jsx'
import QuickActions from './components/QuickActions.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import AdvancedCharts from './components/AdvancedCharts.jsx'
import PDFExport from './components/PDFExport.jsx'
import QuickFill from './components/QuickFill.jsx'
import NotificationCenter, { showNotification } from './components/NotificationCenter.jsx'
import { useTheme } from './contexts/ThemeContext.jsx'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js'
import { addHistoryItem } from './utils/history.js'
import PartnerManager from './components/PartnerManager.jsx'
import Navigation from './components/Navigation.jsx'
import DeliveryCenter from './components/DeliveryCenter.jsx'
import TagManager from './components/TagManager.jsx'
import ReminderManager from './components/ReminderManager.jsx'
import ImportTemplateGenerator from './components/ImportTemplateGenerator.jsx'
import Calendar from './components/Calendar.jsx'
import ProjectProfit from './components/ProjectProfit.jsx'
import ChannelBilling from './components/ChannelBilling.jsx'

function App() {
  const { theme } = useTheme()
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
  const [quickFillData, setQuickFillData] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [invoiceForm, setInvoiceForm] = useState({
    title: '',
    taxNo: '',
    amount: '',
    status: '未开',
    issueDate: '',
    remark: ''
  })
  const [invoiceRecords, setInvoiceRecords] = useState([])
  const [invoiceFilter, setInvoiceFilter] = useState({ keyword: '', status: '全部' })
  const [showVerificationDialog, setShowVerificationDialog] = useState(false)
  const [selectedInvoiceForVerification, setSelectedInvoiceForVerification] = useState(null)
  const [verificationRecordIds, setVerificationRecordIds] = useState([])
  const [lastSaveTime, setLastSaveTime] = useState(null)
  const [partners, setPartners] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [channelRecords, setChannelRecords] = useState([])

  // 从localStorage加载数据
  useEffect(() => {
    const savedRecords = localStorage.getItem('reconciliationRecords')
    const savedPartyA = localStorage.getItem('partyA')
    const savedPartyB = localStorage.getItem('partyB')
    const savedMonth = localStorage.getItem('settlementMonth')
    const savedPartners = localStorage.getItem('partners')
    const savedDeliveries = localStorage.getItem('deliveries')
    
    if (savedRecords) setRecords(JSON.parse(savedRecords))
    if (savedPartyA) setPartyA(JSON.parse(savedPartyA))
    if (savedPartyB) setPartyB(JSON.parse(savedPartyB))
    if (savedMonth) setSettlementMonth(savedMonth)
    if (savedPartners) setPartners(JSON.parse(savedPartners))
    if (savedDeliveries) setDeliveries(JSON.parse(savedDeliveries))
    
    const savedChannelRecords = localStorage.getItem('channelRecords')
    if (savedChannelRecords) setChannelRecords(JSON.parse(savedChannelRecords))
  }, [])

  // 保存数据到localStorage
  useEffect(() => {
    localStorage.setItem('reconciliationRecords', JSON.stringify(records))
    setLastSaveTime(new Date())
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

  useEffect(() => {
    localStorage.setItem('partners', JSON.stringify(partners))
  }, [partners])

  useEffect(() => {
    localStorage.setItem('deliveries', JSON.stringify(deliveries))
  }, [deliveries])

  useEffect(() => {
    localStorage.setItem('channelRecords', JSON.stringify(channelRecords))
  }, [channelRecords])

  // 发票记录持久化
  useEffect(() => {
    const savedInvoices = localStorage.getItem('invoiceRecords')
    if (savedInvoices) {
      setInvoiceRecords(JSON.parse(savedInvoices))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('invoiceRecords', JSON.stringify(invoiceRecords))
  }, [invoiceRecords])

  // 计算结算金额
  const calculateSettlementAmount = (record) => {
    const gameFlow = parseFloat(record.gameFlow || 0)
    const testingFee = parseFloat(record.testingFee || 0)
    const voucher = parseFloat(record.voucher || 0)
    const channelFeeRate = parseFloat(record.channelFeeRate || 0) / 100
    const taxPoint = parseFloat(record.taxPoint || 0) / 100
    const revenueShareRatio = parseFloat(record.revenueShareRatio || 0) / 100
    const discount = parseFloat(record.discount || 1) // 默认1，表示无折扣
    const refund = parseFloat(record.refund || 0)

    // 结算金额 = (游戏流水 - 测试费 - 代金券) * (1 - 通道费率) * (1 - 税点) * 分成比例 * 折扣 - 退款
    const baseAmount = gameFlow - testingFee - voucher
    const afterChannelFee = baseAmount * (1 - channelFeeRate)
    const afterTax = afterChannelFee * (1 - taxPoint)
    const afterShare = afterTax * revenueShareRatio
    const afterDiscount = afterShare * discount
    const finalAmount = afterDiscount - refund

    // 使用四舍五入确保精度，避免浮点数误差
    return Math.max(0, Math.round(finalAmount * 100) / 100)
  }

  const addRecord = (record) => {
    const settlementAmount = calculateSettlementAmount(record)
    // 确保四舍五入到两位小数
    const roundedAmount = Math.round(settlementAmount * 100) / 100
    const newRecords = [...records, { 
      ...record, 
      id: Date.now(),
      settlementAmount: roundedAmount.toFixed(2)
    }]
    setRecords(newRecords)
    addHistoryItem('添加记录', { records: newRecords, partyA, partyB, settlementMonth })
    showToast('记录添加成功！', 'success')
  }

  const updateRecord = (id, updatedRecord) => {
    const settlementAmount = calculateSettlementAmount(updatedRecord)
    // 确保四舍五入到两位小数
    const roundedAmount = Math.round(settlementAmount * 100) / 100
    setRecords(records.map(r => 
      r.id === id 
        ? { ...updatedRecord, id, settlementAmount: roundedAmount.toFixed(2) }
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
        // 重新计算结算金额，使用四舍五入确保精度
        const settlementAmount = calculateSettlementAmount(updated)
        const roundedAmount = Math.round(settlementAmount * 100) / 100
        return { ...updated, settlementAmount: roundedAmount.toFixed(2) }
      }
      return r
    }))
    setSelectedIds([])
    showToast(`已更新 ${ids.length} 条记录`, 'success')
  }

  const handleCopyRecord = (newRecord) => {
    const settlementAmount = calculateSettlementAmount(newRecord)
    // 使用四舍五入确保精度
    const roundedAmount = Math.round(settlementAmount * 100) / 100
    setRecords([...records, { ...newRecord, settlementAmount: roundedAmount.toFixed(2) }])
    showToast('记录已复制', 'success')
  }

  const handleReorder = (newRecords) => {
    setRecords(newRecords)
    showToast('记录顺序已调整', 'success')
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
    showNotification(message, type, 3000)
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
    const totalGameFlow = records.reduce((sum, r) => sum + (parseFloat(r.gameFlow) || 0), 0)
    const totalTestingFee = records.reduce((sum, r) => sum + (parseFloat(r.testingFee) || 0), 0)
    const totalVoucher = records.reduce((sum, r) => sum + (parseFloat(r.voucher) || 0), 0)
    const totalSettlementAmount = records.reduce((sum, r) => sum + (parseFloat(r.settlementAmount) || 0), 0)
    const totalRefund = records.reduce((sum, r) => sum + (parseFloat(r.refund) || 0), 0)
    
    return {
      totalGameFlow,
      totalTestingFee,
      totalVoucher,
      totalSettlementAmount,
      totalRefund,
      recordCount: records.length,
      avgSettlementAmount: records.length > 0 ? totalSettlementAmount / records.length : 0,
      avgGameFlow: records.length > 0 ? totalGameFlow / records.length : 0
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

  const handleClearAll = () => {
    setRecords([])
    showToast('所有记录已清空', 'success')
  }

  const handleExportAll = () => {
    const data = {
      records,
      partyA,
      partyB,
      settlementMonth,
      partners,
      deliveries,
      exportDate: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `全部数据备份_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('数据导出成功！', 'success')
  }

  const handleExportError = (message = '导出失败，请稍后重试') => {
    showToast(message, 'error')
  }

  // 导出当前筛选结果
  const handleExportFiltered = () => {
    if (filteredRecords.length === 0) {
      showToast('没有可导出的数据', 'error')
      return
    }
    
    const data = {
      records: filteredRecords,
      partyA,
      partyB,
      settlementMonth,
      exportDate: new Date().toISOString(),
      filterInfo: {
        searchTerm,
        filterOptions,
        sortOptions,
        totalRecords: records.length,
        filteredRecords: filteredRecords.length
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `筛选结果_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast(`成功导出 ${filteredRecords.length} 条筛选记录！`, 'success')
  }

  // 导出选中记录
  const handleExportSelected = () => {
    if (selectedIds.length === 0) {
      showToast('请先选择要导出的记录', 'error')
      return
    }
    
    const selectedRecords = records.filter(r => selectedIds.includes(r.id))
    const data = {
      records: selectedRecords,
      partyA,
      partyB,
      settlementMonth,
      exportDate: new Date().toISOString(),
      selectedCount: selectedIds.length
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `选中记录_${selectedIds.length}条_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast(`成功导出 ${selectedIds.length} 条选中记录！`, 'success')
  }

  const handleAddInvoice = (e) => {
    e.preventDefault()
    if (!invoiceForm.title) {
      showToast('请填写发票抬头', 'error')
      return
    }
    if (!invoiceForm.taxNo) {
      showToast('请填写税号', 'error')
      return
    }
    const newItem = {
      ...invoiceForm,
      id: Date.now(),
      amount: parseFloat(invoiceForm.amount || 0).toFixed(2)
    }
    setInvoiceRecords([newItem, ...invoiceRecords])
    setInvoiceForm({
      title: '',
      taxNo: '',
      amount: '',
      status: '未开',
      issueDate: '',
      remark: ''
    })
    showToast('发票记录已添加', 'success')
  }

  const handleDeleteInvoice = (id) => {
    setInvoiceRecords(invoiceRecords.filter(item => item.id !== id))
    showToast('发票记录已删除', 'success')
  }

  // 打开核销对话框
  const handleOpenVerification = (invoice) => {
    setSelectedInvoiceForVerification(invoice)
    setVerificationRecordIds(invoice.verifiedRecordIds || [])
    setShowVerificationDialog(true)
  }

  // 确认核销
  const handleConfirmVerification = () => {
    if (!selectedInvoiceForVerification) return
    
    setInvoiceRecords(invoiceRecords.map(item => 
      item.id === selectedInvoiceForVerification.id
        ? { ...item, verifiedRecordIds: verificationRecordIds, verified: verificationRecordIds.length > 0 }
        : item
    ))
    setShowVerificationDialog(false)
    setSelectedInvoiceForVerification(null)
    setVerificationRecordIds([])
    showToast('核销成功', 'success')
  }

  // 取消核销对话框
  const handleCancelVerification = () => {
    setShowVerificationDialog(false)
    setSelectedInvoiceForVerification(null)
    setVerificationRecordIds([])
  }

  const filteredInvoices = useMemo(() => {
    return invoiceRecords.filter(item => {
      const matchStatus = invoiceFilter.status === '全部' || item.status === invoiceFilter.status
      const kw = (invoiceFilter.keyword || '').trim().toLowerCase()
      const matchKeyword = !kw || `${item.title || ''} ${item.taxNo || ''} ${item.remark || ''}`.toLowerCase().includes(kw)
      return matchStatus && matchKeyword
    })
  }, [invoiceRecords, invoiceFilter])

  const handleExportInvoiceJSON = () => {
    const blob = new Blob([JSON.stringify(invoiceRecords, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `发票记录_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('发票记录已导出 (JSON)', 'success')
  }

  const handleExportInvoiceCSV = () => {
    if (invoiceRecords.length === 0) {
      showToast('暂无发票记录可导出', 'error')
      return
    }
    const headers = ['抬头', '税号', '金额', '状态', '开票日期', '备注']
    const rows = invoiceRecords.map(r => [
      `"${r.title || ''}"`,
      `"${r.taxNo || ''}"`,
      r.amount || '0.00',
      r.status || '',
      r.issueDate || '',
      `"${r.remark || ''}"`
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `发票记录_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('发票记录已导出 (CSV)', 'success')
  }

  // 从文件名解析发票信息
  const parseInvoiceFromFilename = (filename) => {
    // 格式：深圳龙魂+广州熊动22557.99+20260126.pdf
    // 或：销售方+购买方+金额+日期.pdf
    const nameWithoutExt = filename.replace(/\.(pdf|json)$/i, '')
    const parts = nameWithoutExt.split('+')
    
    if (parts.length >= 3) {
      const seller = parts[0]?.trim() || ''
      const buyer = parts[1]?.trim() || ''
      const amountMatch = parts[2]?.match(/(\d+\.?\d*)/)
      const dateMatch = parts[2]?.match(/(\d{8})/) || parts[3]?.match(/(\d{8})/)
      
      const amount = amountMatch ? amountMatch[1] : ''
      const dateStr = dateMatch ? dateMatch[1] : ''
      
      // 格式化日期 YYYYMMDD -> YYYY-MM-DD
      let formattedDate = ''
      if (dateStr && dateStr.length === 8) {
        formattedDate = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
      }
      
      return {
        title: buyer || seller, // 购买方作为发票抬头
        taxNo: '', // 税号需要手动填写
        amount: amount,
        issueDate: formattedDate,
        status: '已开',
        remark: `销售方：${seller}`
      }
    }
    return null
  }

  const handleImportInvoiceJSON = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // 如果是PDF文件，尝试从文件名解析
    if (file.name.toLowerCase().endsWith('.pdf')) {
      const parsedInfo = parseInvoiceFromFilename(file.name)
      if (parsedInfo) {
        setInvoiceForm({
          ...invoiceForm,
          ...parsedInfo
        })
        showToast('已从文件名解析发票信息，请确认并补充税号后保存', 'success')
        e.target.value = ''
        return
      } else {
        showToast('无法从文件名解析信息，请手动录入', 'info')
        e.target.value = ''
        return
      }
    }
    
    // JSON文件处理
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (Array.isArray(data)) {
          const normalized = data.map(item => ({
            ...item,
            id: item.id || Date.now() + Math.random(),
            amount: parseFloat(item.amount || 0).toFixed(2),
            status: item.status || '未开'
          }))
          setInvoiceRecords(normalized)
          showToast('发票记录已导入', 'success')
        } else {
          showToast('文件格式不正确', 'error')
        }
      } catch (err) {
        console.error(err)
        showToast('导入失败，文件格式错误', 'error')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const invoiceFileInputRef = React.useRef(null)

  const renderInvoice = () => (
    <div className="invoice-section">
      <div className="invoice-grid">
        <form className="invoice-form" onSubmit={handleAddInvoice}>
          <h3>发票信息</h3>
          <div className="invoice-row">
            <label>发票抬头 *</label>
            <input
              type="text"
              value={invoiceForm.title}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, title: e.target.value })}
              placeholder="公司名称"
            />
          </div>
          <div className="invoice-row">
            <label>税号 *</label>
            <input
              type="text"
              value={invoiceForm.taxNo}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, taxNo: e.target.value })}
              placeholder="纳税人识别号"
            />
          </div>
          <div className="invoice-row two-col">
            <div>
              <label>开票金额(元)</label>
              <input
                type="number"
                step="0.01"
                value={invoiceForm.amount}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label>开票日期</label>
              <input
                type="date"
                value={invoiceForm.issueDate}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })}
              />
            </div>
          </div>
          <div className="invoice-row two-col">
            <div>
              <label>状态</label>
              <select
                value={invoiceForm.status}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value })}
              >
                <option value="未开">未开</option>
                <option value="已开">已开</option>
                <option value="作废">作废</option>
              </select>
            </div>
            <div>
              <label>备注</label>
              <input
                type="text"
                value={invoiceForm.remark}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, remark: e.target.value })}
                placeholder="可填写收件人、邮箱等"
              />
            </div>
          </div>
          <div className="invoice-form-actions">
            <button type="submit" className="submit-btn">保存发票记录</button>
            <button 
              type="button" 
              className="secondary-btn" 
              onClick={() => {
                // 快速录入：从剪贴板或手动输入文件名解析
                const filename = prompt('请输入发票文件名（格式：销售方+购买方+金额+日期），例如：深圳龙魂+广州熊动22557.99+20260126')
                if (filename) {
                  const parsedInfo = parseInvoiceFromFilename(filename)
                  if (parsedInfo) {
                    setInvoiceForm({
                      ...invoiceForm,
                      ...parsedInfo
                    })
                    showToast('已解析发票信息，请确认并补充税号后保存', 'success')
                  } else {
                    showToast('文件名格式不正确', 'error')
                  }
                }
              }}
              title="从文件名快速解析发票信息"
            >
              快速录入
            </button>
          </div>
        </form>

        <div className="invoice-list">
          <div className="list-header">
            <div className="list-title">
              <h3>发票列表</h3>
              <span className="muted">共 {filteredInvoices.length} 条</span>
            </div>
            <div className="invoice-toolbar">
              <input
                type="text"
                placeholder="搜索抬头/税号/备注"
                value={invoiceFilter.keyword}
                onChange={(e) => setInvoiceFilter({ ...invoiceFilter, keyword: e.target.value })}
              />
              <select
                value={invoiceFilter.status}
                onChange={(e) => setInvoiceFilter({ ...invoiceFilter, status: e.target.value })}
              >
                <option value="全部">全部</option>
                <option value="未开">未开</option>
                <option value="已开">已开</option>
                <option value="作废">作废</option>
              </select>
              <button type="button" className="secondary-btn" onClick={handleExportInvoiceJSON}>导出 JSON</button>
              <button type="button" className="secondary-btn" onClick={handleExportInvoiceCSV}>导出 CSV</button>
              <button type="button" className="secondary-btn" onClick={() => invoiceFileInputRef.current?.click()}>导入 (JSON/PDF)</button>
              <input
                ref={invoiceFileInputRef}
                type="file"
                accept=".json,.pdf"
                style={{ display: 'none' }}
                onChange={handleImportInvoiceJSON}
              />
            </div>
          </div>
          {filteredInvoices.length === 0 ? (
            <div className="empty-invoice">暂无发票记录</div>
          ) : (
            <div className="invoice-table">
              <div className="invoice-table-head">
                <span>抬头</span>
                <span>税号</span>
                <span>金额</span>
                <span>状态</span>
                <span>开票日期</span>
                <span>核销状态</span>
                <span>备注</span>
                <span>操作</span>
              </div>
              {filteredInvoices.map(item => {
                const verifiedRecordIds = item.verifiedRecordIds || []
                const verifiedRecords = records.filter(r => verifiedRecordIds.includes(r.id))
                const verifiedAmount = verifiedRecords.reduce((sum, r) => sum + parseFloat(r.settlementAmount || 0), 0)
                
                return (
                  <div className="invoice-table-row" key={item.id}>
                    <span title={item.title}>{item.title || '-'}</span>
                    <span title={item.taxNo}>{item.taxNo || '-'}</span>
                    <span>¥{item.amount || '0.00'}</span>
                    <span className={`tag tag-${item.status}`}>{item.status}</span>
                    <span>{item.issueDate || '-'}</span>
                    <span>
                      {item.verified ? (
                        <span className="tag tag-verified" title={`已核销 ${verifiedRecordIds.length} 条记录，金额 ¥${verifiedAmount.toFixed(2)}`}>
                          已核销 ({verifiedRecordIds.length})
                        </span>
                      ) : (
                        <span className="tag tag-unverified">未核销</span>
                      )}
                    </span>
                    <span title={item.remark}>{item.remark || '-'}</span>
                    <span>
                      <button
                        type="button"
                        className="verify-btn"
                        onClick={() => handleOpenVerification(item)}
                        title="核销发票"
                      >
                        核销
                      </button>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => handleDeleteInvoice(item.id)}
                      >
                        删除
                      </button>
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderPartners = () => (
    <div className="partner-page">
      <PartnerManager 
        partners={partners}
        onPartnersChange={(newPartners) => {
          setPartners(newPartners)
          showToast('客户库已更新', 'success')
        }}
      />
    </div>
  )

  const renderDelivery = () => (
    <div className="delivery-page">
      <DeliveryCenter 
        deliveries={deliveries}
        onDeliveriesChange={(newDeliveries) => {
          setDeliveries(newDeliveries)
          showToast('快递记录已更新', 'success')
        }}
        partners={partners}
      />
    </div>
  )

  const renderDashboard = () => (
    <>
      {lastSaveTime && (
        <div className="save-indicator">
          <span className="save-time">💾 数据已自动保存：{lastSaveTime.toLocaleTimeString('zh-CN')}</span>
          <span className="shortcut-hint" style={{ marginLeft: '12px', fontSize: '0.8rem', opacity: 0.7 }}>
            (Ctrl+F 搜索 | Ctrl+P 打印 | Ctrl+Enter 保存编辑)
          </span>
        </div>
      )}
      <div className="quick-actions-section">
        <QuickActions
          onClearAll={handleClearAll}
          onExportAll={handleExportAll}
          onImportData={() => {
            const fileInput = document.createElement('input')
            fileInput.type = 'file'
            fileInput.accept = '.json,.xlsx,.xls'
            fileInput.onchange = (e) => {
              const file = e.target.files?.[0]
              if (file) {
                if (file.name.endsWith('.json')) {
                  // 处理JSON导入
                  const reader = new FileReader()
                  reader.onload = (ev) => {
                    try {
                      const data = JSON.parse(ev.target.result)
                      if (data.records) setRecords(data.records)
                      showToast('数据导入成功！', 'success')
                    } catch (err) {
                      showToast('导入失败：文件格式错误', 'error')
                    }
                  }
                  reader.readAsText(file)
                } else {
                  showToast('请使用Excel导入功能', 'info')
                }
              }
            }
            fileInput.click()
          }}
          onGenerateTemplate={() => setActiveTab('settings')}
          onShowTags={() => setActiveTab('tags')}
          onShowReminders={() => setActiveTab('reminders')}
          recordCount={records.length}
          statistics={statistics}
        />
      </div>
      <div className="summary-section">
        <SummaryCard title="记录总数" value={statistics.recordCount} icon="📋" />
        <SummaryCard title="游戏流水总额" value={`¥${statistics.totalGameFlow.toFixed(2)}`} icon="💰" />
        <SummaryCard title="代金券总额" value={`¥${statistics.totalVoucher.toFixed(2)}`} icon="🎫" />
        <SummaryCard title="结算金额总额" value={`¥${statistics.totalSettlementAmount.toFixed(2)}`} icon="💵" />
        <SummaryCard title="平均结算金额" value={`¥${statistics.avgSettlementAmount.toFixed(2)}`} icon="📊" />
        <SummaryCard title="退款总额" value={`¥${statistics.totalRefund.toFixed(2)}`} icon="↩️" />
        <SummaryCard title="测试费总额" value={`¥${statistics.totalTestingFee.toFixed(2)}`} icon="🧪" />
        <SummaryCard title="平均游戏流水" value={`¥${statistics.avgGameFlow.toFixed(2)}`} icon="📈" />
      </div>
      <div className="validator-section">
        <DataValidator 
          records={records} 
          onIssueClick={(recordId) => {
            // 可以在这里实现跳转到记录的功能
            setActiveTab('records')
            showToast('请手动查找并修复该记录', 'info')
          }}
        />
      </div>
      <div className="statistics-section">
        <StatisticsChart records={records} />
      </div>
      <div className="advanced-charts-section">
        <AdvancedCharts records={records} />
      </div>
      <div className="report-section">
        <StatisticsReport records={records} />
      </div>
    </>
  )

  const renderRecords = () => (
    <>
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
          {filteredRecords.length < records.length && (
            <button 
              className="export-filtered-btn" 
              onClick={handleExportFiltered}
              title="导出当前筛选结果"
            >
              📤 导出筛选结果 ({filteredRecords.length})
            </button>
          )}
          {selectedIds.length > 0 && (
            <button 
              className="export-selected-btn" 
              onClick={handleExportSelected}
              title="导出选中记录"
            >
              📥 导出选中 ({selectedIds.length})
            </button>
          )}
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
              if (data.records) setRecords(data.records)
              if (data.partyA) setPartyA(data.partyA)
              if (data.partyB) setPartyB(data.partyB)
              if (data.settlementMonth) setSettlementMonth(data.settlementMonth)
              if (data.partners) setPartners(data.partners)
              if (data.deliveries) setDeliveries(data.deliveries)
              showToast('数据导入成功！', 'success')
            }}
          />
        </div>
      </div>

      <div className="main-content">
        <div className="form-section">
          <div className="form-header">
            <h3>添加对账记录</h3>
            <div className="form-header-actions">
              <QuickFill onFill={(data) => {
                setQuickFillData(data)
                showNotification('快速填充模板已应用', 'success')
              }} />
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
                name: name,
                category: '游戏研发商',
                tag2: '',
                createdAt: new Date().toISOString()
              }
              setPartners([...partners, newPartner])
              showToast(`客户"${name}"已添加到客户库`, 'success')
            }}
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
            onReorder={handleReorder}
            sortOptions={sortOptions}
            onSortChange={(field, order) => setSortOptions({ field, order })}
          />
        </div>
      </div>

      <div className="comparison-section">
        <DataComparison records={records} />
      </div>
    </>
  )

  const renderAnalysis = () => (
    <>
      <div className="project-profit-section">
        <ProjectProfit records={records} channelRecords={channelRecords} />
      </div>
      <div className="statistics-section">
        <StatisticsChart records={records} />
      </div>
      <div className="advanced-charts-section">
        <AdvancedCharts records={records} />
      </div>
      <div className="comparison-section">
        <DataComparison records={records} />
      </div>
      <div className="report-section">
        <StatisticsReport records={records} />
      </div>
    </>
  )

  const renderSettings = () => (
    <div className="settings-grid">
      <div className="config-section settings-card">
        <h3 className="section-title">公司信息</h3>
        <CompanyInfo
          partyA={partyA}
          partyB={partyB}
          onUpdatePartyA={setPartyA}
          onUpdatePartyB={setPartyB}
        />
      </div>
      <div className="config-section settings-card">
        <h3 className="section-title">账单模板管理</h3>
        <BillManager
          records={records}
          partyA={partyA}
          partyB={partyB}
          settlementMonth={settlementMonth}
          onLoadBill={handleLoadBill}
        />
      </div>
      <div className="config-section settings-card">
        <h3 className="section-title">数据备份与导入</h3>
        <div className="settings-tools">
          <DataBackup 
            records={records}
            partyA={partyA}
            partyB={partyB}
            settlementMonth={settlementMonth}
            partners={partners}
            deliveries={deliveries}
            onImport={(data) => {
              if (data.records) setRecords(data.records)
              if (data.partyA) setPartyA(data.partyA)
              if (data.partyB) setPartyB(data.partyB)
              if (data.settlementMonth) setSettlementMonth(data.settlementMonth)
              if (data.partners) setPartners(data.partners)
              if (data.deliveries) setDeliveries(data.deliveries)
              showToast('数据导入成功！', 'success')
            }}
          />
          <ExcelImport onImport={handleExcelImport} />
          <HistoryPanel onRestore={handleRestoreFromHistory} />
        </div>
      </div>
      <div className="config-section settings-card">
        <h3 className="section-title">导入模板生成器</h3>
        <ImportTemplateGenerator 
          onTemplateGenerated={(type, fileName) => {
            showToast(`模板 ${fileName} 已生成`, 'success')
          }}
        />
      </div>
      <div className="config-section settings-card">
        <h3 className="section-title">标签管理</h3>
        <TagManager 
          records={records}
          onTagChange={(recordId, updatedRecord) => {
            if (updatedRecord && recordId) {
              updateRecord(recordId, updatedRecord)
              showToast('标签已更新', 'success')
            }
          }}
        />
      </div>
      <div className="config-section settings-card">
        <h3 className="section-title">提醒事项</h3>
        <ReminderManager 
          onReminderAdd={(reminder) => {
            showToast(`提醒"${reminder.title}"已添加`, 'success')
          }}
        />
      </div>
    </div>
  )

  return (
    <ErrorBoundary>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <div className="header-brand">
              <h1>对账管理系统</h1>
              <p>生成标准格式的对账单</p>
            </div>
            <div className="header-actions">
              <Calendar 
                compact={true}
                onDateSelect={(date, dateStr) => {
                  console.log('选择日期:', dateStr)
                }}
              />
              <NotificationCenter />
              <ThemeToggle />
              <UserGuide />
              <Settings onSettingsChange={(settings) => {
                console.log('设置已更新', settings)
              }} />
              <HelpTooltip />
            </div>
          </div>
        </header>

      <div className="app-container">
        <Navigation
          activeTab={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'dashboard', label: '总览' },
            { key: 'records', label: '研发对账' },
            { key: 'channel', label: '渠道对账' },
            { key: 'partners', label: '客户管理' },
            { key: 'delivery', label: '快递中心' },
            { key: 'analysis', label: '分析报表' },
            { key: 'settings', label: '配置与资料' },
            { key: 'invoice', label: '发票' },
            { key: 'tags', label: '标签管理' },
            { key: 'reminders', label: '提醒事项' }
          ]}
        />

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'records' && renderRecords()}
        {activeTab === 'channel' && (
          <ChannelBilling
            channelRecords={channelRecords}
            onAddRecord={(record) => {
              const newRecord = { ...record, id: Date.now() }
              setChannelRecords([...channelRecords, newRecord])
              showToast('渠道记录添加成功', 'success')
            }}
            onUpdateRecord={(id, record) => {
              setChannelRecords(channelRecords.map(r => r.id === id ? { ...record, id } : r))
              showToast('渠道记录更新成功', 'success')
            }}
            onDeleteRecord={(id) => {
              setChannelRecords(channelRecords.filter(r => r.id !== id))
              showToast('渠道记录已删除', 'success')
            }}
          />
        )}
        {activeTab === 'partners' && renderPartners()}
        {activeTab === 'delivery' && renderDelivery()}
        {activeTab === 'analysis' && renderAnalysis()}
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'invoice' && renderInvoice()}
        {activeTab === 'tags' && (
          <div className="tags-page">
            <TagManager 
              records={records}
              onTagChange={(recordId, updatedRecord) => {
                if (updatedRecord && recordId) {
                  updateRecord(recordId, updatedRecord)
                  showToast('标签已更新', 'success')
                }
              }}
            />
          </div>
        )}
        {activeTab === 'reminders' && (
          <div className="reminders-page">
            <ReminderManager 
              onReminderAdd={(reminder) => {
                showToast(`提醒"${reminder.title}"已添加`, 'success')
              }}
            />
          </div>
        )}

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

      {/* 核销对话框 */}
      <ConfirmDialog
        isOpen={showVerificationDialog}
        title="发票核销"
        message={
          selectedInvoiceForVerification ? (
            <div className="verification-dialog-content">
              <div className="invoice-info">
                <p><strong>发票抬头：</strong>{selectedInvoiceForVerification.title}</p>
                <p><strong>发票金额：</strong>¥{selectedInvoiceForVerification.amount || '0.00'}</p>
              </div>
              <div className="verification-records">
                <label>选择要核销的对账记录：</label>
                <div className="records-checkbox-list">
                  {records.length === 0 ? (
                    <p className="no-records">暂无对账记录</p>
                  ) : (
                    records.map(record => (
                      <label key={record.id} className="record-checkbox-item">
                        <input
                          type="checkbox"
                          checked={verificationRecordIds.includes(record.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setVerificationRecordIds([...verificationRecordIds, record.id])
                            } else {
                              setVerificationRecordIds(verificationRecordIds.filter(id => id !== record.id))
                            }
                          }}
                        />
                        <span>
                          {record.settlementMonth || '未设置月份'} - {record.partner || '未设置合作方'} - {record.game || '未设置游戏'} 
                          <strong className="amount"> (¥{parseFloat(record.settlementAmount || 0).toFixed(2)})</strong>
                        </span>
                      </label>
                    ))
                  )}
                </div>
                {verificationRecordIds.length > 0 && (
                  <div className="verification-summary">
                    <p>已选择 {verificationRecordIds.length} 条记录</p>
                    <p>核销金额：¥{records
                      .filter(r => verificationRecordIds.includes(r.id))
                      .reduce((sum, r) => sum + parseFloat(r.settlementAmount || 0), 0)
                      .toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          ) : ''
        }
        onConfirm={handleConfirmVerification}
        onCancel={handleCancelVerification}
        confirmText="确认核销"
        cancelText="取消"
      />
      </div>
    </ErrorBoundary>
  )
}

export default App

