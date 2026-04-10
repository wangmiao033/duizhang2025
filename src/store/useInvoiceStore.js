import React, { useState, useEffect } from 'react'
import { STORAGE_KEYS, storageGet, storageSet } from '@/store/useAppStorage.js'
import { parseInvoiceFromFilename } from '@/domain/invoice/invoiceParsers.js'
import { filterInvoiceRecords } from '@/domain/invoice/invoiceFilters.js'
import { buildInvoiceCsvContent } from '@/domain/export/exportAdapters.js'

const defaultInvoiceForm = {
  title: '',
  taxNo: '',
  amount: '',
  status: '未开',
  issueDate: '',
  remark: ''
}

export function useInvoiceStore({ showToast }) {
  const [invoiceForm, setInvoiceForm] = useState(defaultInvoiceForm)

  const resetInvoiceForm = React.useCallback(() => {
    setInvoiceForm({ ...defaultInvoiceForm })
  }, [])
  const [invoiceRecords, setInvoiceRecords] = useState([])
  const [invoiceFilter, setInvoiceFilter] = useState({ keyword: '', status: '全部' })
  const [showVerificationDialog, setShowVerificationDialog] = useState(false)
  const [selectedInvoiceForVerification, setSelectedInvoiceForVerification] = useState(null)
  const [verificationRecordIds, setVerificationRecordIds] = useState([])

  const invoiceFileInputRef = React.useRef(null)

  useEffect(() => {
    const savedInvoices = storageGet(STORAGE_KEYS.INVOICE_RECORDS)
    if (savedInvoices) {
      setInvoiceRecords(savedInvoices)
    }
  }, [])

  useEffect(() => {
    storageSet(STORAGE_KEYS.INVOICE_RECORDS, invoiceRecords)
  }, [invoiceRecords])

  const filteredInvoices = filterInvoiceRecords(invoiceRecords, invoiceFilter)

  /**
   * 独立新增/编辑页提交：校验规则与历史 handleAddInvoice 一致；编辑时保留 verified / verifiedRecordIds
   */
  const submitInvoiceFromForm = (formData, { editId, resetFormAfterAdd = true } = {}) => {
    if (!formData.title) {
      showToast('请填写发票抬头', 'error')
      return false
    }
    if (!formData.taxNo) {
      showToast('请填写税号', 'error')
      return false
    }
    const amountStr = parseFloat(formData.amount || 0).toFixed(2)
    if (editId != null) {
      setInvoiceRecords(
        invoiceRecords.map((item) =>
          item.id === editId
            ? {
                ...item,
                ...formData,
                amount: amountStr,
                id: editId
              }
            : item
        )
      )
      showToast('发票记录已更新', 'success')
      return true
    }
    const newItem = {
      ...formData,
      id: Date.now(),
      amount: amountStr
    }
    setInvoiceRecords([newItem, ...invoiceRecords])
    if (resetFormAfterAdd) {
      setInvoiceForm({ ...defaultInvoiceForm })
    }
    showToast('发票记录已添加', 'success')
    return true
  }

  const handleAddInvoice = (e) => {
    e.preventDefault()
    submitInvoiceFromForm(invoiceForm, { resetFormAfterAdd: true })
  }

  const updateInvoiceRecord = React.useCallback((id, record) => {
    setInvoiceRecords((prev) => prev.map((item) => (item.id === id ? { ...record, id } : item)))
  }, [])

  const handleDeleteInvoice = (id) => {
    setInvoiceRecords(invoiceRecords.filter((item) => item.id !== id))
    showToast('发票记录已删除', 'success')
  }

  const handleOpenVerification = (invoice) => {
    setSelectedInvoiceForVerification(invoice)
    setVerificationRecordIds(invoice.verifiedRecordIds || [])
    setShowVerificationDialog(true)
  }

  const handleConfirmVerification = () => {
    if (!selectedInvoiceForVerification) return
    setInvoiceRecords(
      invoiceRecords.map((item) =>
        item.id === selectedInvoiceForVerification.id
          ? {
              ...item,
              verifiedRecordIds: verificationRecordIds,
              verified: verificationRecordIds.length > 0
            }
          : item
      )
    )
    setShowVerificationDialog(false)
    setSelectedInvoiceForVerification(null)
    setVerificationRecordIds([])
    showToast('核销成功', 'success')
  }

  const handleCancelVerification = () => {
    setShowVerificationDialog(false)
    setSelectedInvoiceForVerification(null)
    setVerificationRecordIds([])
  }

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
    const csv = buildInvoiceCsvContent(invoiceRecords)
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

  const handleImportInvoiceJSON = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

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
      }
      showToast('无法从文件名解析信息，请手动录入', 'info')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (Array.isArray(data)) {
          const normalized = data.map((item) => ({
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

  return {
    invoiceForm,
    setInvoiceForm,
    resetInvoiceForm,
    invoiceRecords,
    setInvoiceRecords,
    invoiceFilter,
    setInvoiceFilter,
    filteredInvoices,
    showVerificationDialog,
    setShowVerificationDialog,
    selectedInvoiceForVerification,
    verificationRecordIds,
    setVerificationRecordIds,
    invoiceFileInputRef,
    handleAddInvoice,
    submitInvoiceFromForm,
    updateInvoiceRecord,
    handleDeleteInvoice,
    handleOpenVerification,
    handleConfirmVerification,
    handleCancelVerification,
    handleExportInvoiceJSON,
    handleExportInvoiceCSV,
    handleImportInvoiceJSON,
    parseInvoiceFromFilename
  }
}
