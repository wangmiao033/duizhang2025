import React, { useState, useEffect, useCallback, useRef } from 'react'
import { STORAGE_KEYS, storageGet, storageSet } from '@/store/useAppStorage.js'
import { parseInvoiceFromFilename } from '@/domain/invoice/invoiceParsers.js'
import { filterInvoiceRecords } from '@/domain/invoice/invoiceFilters.js'
import { buildInvoiceCsvContent } from '@/domain/export/exportAdapters.js'
import {
  listInvoiceRecords,
  createInvoiceRecord,
  updateInvoiceRecord as apiUpdateInvoiceRecord,
  deleteInvoiceRecord as apiDeleteInvoiceRecord,
  apiInvoiceRowToFrontend,
  frontendInvoiceRecordToPayload
} from '@/lib/api/invoice.ts'

const defaultInvoiceForm = {
  invoiceDirection: 'output',
  invoiceType: '',
  digitalInvoiceNo: '',
  invoiceCode: '',
  invoiceNo: '',
  sellerName: '',
  sellerTaxNo: '',
  title: '',
  taxNo: '',
  amount: '',
  taxAmount: '',
  amountWithTax: '',
  status: '未开',
  issueDate: '',
  issuer: '',
  remark: ''
}

function inferInvoiceDirection(r) {
  const explicit = String(r.invoiceDirection || r.invoice_direction || '').trim().toLowerCase()
  if (explicit === 'input' || explicit === 'output') return explicit
  const seller = String(r.sellerName || r.seller_name || '').trim()
  const buyer = String(r.title || '').trim()
  if (seller && !buyer) return 'input'
  return 'output'
}

function normalizeLocalInvoiceRecords(saved) {
  return (saved || []).map((r) => ({
    ...r,
    invoiceDirection: inferInvoiceDirection(r),
    invoiceType: r.invoiceType || r.invoice_type || '',
    digitalInvoiceNo: r.digitalInvoiceNo || r.digital_invoice_no || '',
    invoiceCode: r.invoiceCode || r.invoice_code || '',
    invoiceNo: r.invoiceNo || r.invoice_no || '',
    sellerName: r.sellerName || r.seller_name || '',
    sellerTaxNo: r.sellerTaxNo || r.seller_tax_no || '',
    id: r.id != null ? String(r.id) : String(Date.now()),
    amount: r.amount != null ? String(r.amount) : '0.00',
    taxAmount: r.taxAmount != null ? String(r.taxAmount) : '0.00',
    amountWithTax:
      r.amountWithTax != null
        ? String(r.amountWithTax)
        : (
            (parseFloat(String(r.amount ?? 0)) || 0) + (parseFloat(String(r.taxAmount ?? 0)) || 0)
          ).toFixed(2),
    issuer: r.issuer != null ? String(r.issuer) : '',
    verifiedRecordIds: Array.isArray(r.verifiedRecordIds) ? r.verifiedRecordIds.map(String) : [],
    verified: Boolean(r.verified),
    verifiedAmount:
      r.verifiedAmount != null && r.verifiedAmount !== ''
        ? parseFloat(String(r.verifiedAmount)) || 0
        : 0
  }))
}

export function useInvoiceStore({ showToast }) {
  const [invoiceForm, setInvoiceForm] = useState(defaultInvoiceForm)
  const [invoiceApiEnabled, setInvoiceApiEnabled] = useState(false)
  const [invoiceRecords, setInvoiceRecords] = useState([])
  const [invoiceFilter, setInvoiceFilter] = useState({
    direction: 'all',
    dateStart: '',
    dateEnd: '',
    status: '全部',
    invoiceType: '',
    companyKeyword: '',
    numberKeyword: ''
  })
  const [showVerificationDialog, setShowVerificationDialog] = useState(false)
  const [selectedInvoiceForVerification, setSelectedInvoiceForVerification] = useState(null)
  const [verificationRecordIds, setVerificationRecordIds] = useState([])

  const invoiceFileInputRef = React.useRef(null)
  const showToastRef = useRef(showToast)
  showToastRef.current = showToast

  const resetInvoiceForm = React.useCallback(() => {
    setInvoiceForm({ ...defaultInvoiceForm })
  }, [])

  const refetchInvoiceFromApi = useCallback(async () => {
    const { items } = await listInvoiceRecords({ limit: 500, offset: 0 })
    setInvoiceRecords(items.map(apiInvoiceRowToFrontend))
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await refetchInvoiceFromApi()
        if (cancelled) return
        setInvoiceApiEnabled(true)
      } catch (err) {
        console.error(err)
        if (cancelled) return
        showToastRef.current?.(
          '发票服务器暂时异常，已回退本地缓存。若列表长期不同步，请检查 API 与 Neon 表 invoice_records。',
          'error'
        )
        const savedInvoices = storageGet(STORAGE_KEYS.INVOICE_RECORDS)
        if (savedInvoices?.length) {
          setInvoiceRecords(normalizeLocalInvoiceRecords(savedInvoices))
        }
        setInvoiceApiEnabled(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refetchInvoiceFromApi])

  useEffect(() => {
    storageSet(STORAGE_KEYS.INVOICE_RECORDS, invoiceRecords)
  }, [invoiceRecords])

  const filteredInvoices = filterInvoiceRecords(invoiceRecords, invoiceFilter)

  const submitInvoiceFromForm = async (
    formData,
    { editId, resetFormAfterAdd = true } = {}
  ) => {
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
      const sid = String(editId)
      const existing = invoiceRecords.find((item) => String(item.id) === sid)
      if (!existing) {
        showToast('未找到要编辑的发票', 'error')
        return false
      }
      if (invoiceApiEnabled) {
        try {
          const merged = {
            ...existing,
            ...formData,
            amount: amountStr,
            id: sid
          }
          await apiUpdateInvoiceRecord(sid, frontendInvoiceRecordToPayload(merged))
          await refetchInvoiceFromApi()
          showToast('发票记录已更新', 'success')
          return true
        } catch (e) {
          console.error(e)
          showToast('发票更新服务器失败', 'error')
          return false
        }
      }
      setInvoiceRecords((prev) =>
        prev.map((item) =>
          String(item.id) === sid
            ? {
                ...item,
                ...formData,
                amount: amountStr,
                id: sid
              }
            : item
        )
      )
      showToast('发票记录已更新', 'success')
      return true
    }

    if (invoiceApiEnabled) {
      try {
        await createInvoiceRecord(
          frontendInvoiceRecordToPayload({
            ...formData,
            amount: amountStr,
            verified: false,
            verifiedRecordIds: [],
            verifiedAmount: 0
          })
        )
        await refetchInvoiceFromApi()
        if (resetFormAfterAdd) {
          setInvoiceForm({ ...defaultInvoiceForm })
        }
        showToast('发票记录已添加', 'success')
        return true
      } catch (e) {
        console.error(e)
        showToast('发票保存服务器失败', 'error')
        return false
      }
    }

    const newItem = {
      ...formData,
      id: String(Date.now()),
      amount: amountStr,
      verified: false,
      verifiedRecordIds: [],
      verifiedAmount: 0
    }
    setInvoiceRecords((prev) => [newItem, ...prev])
    if (resetFormAfterAdd) {
      setInvoiceForm({ ...defaultInvoiceForm })
    }
    showToast('发票记录已添加', 'success')
    return true
  }

  const handleAddInvoice = (e) => {
    e.preventDefault()
    void submitInvoiceFromForm(invoiceForm, { resetFormAfterAdd: true })
  }

  const updateInvoiceRecord = React.useCallback(
    async (id, record) => {
      const sid = String(id)
      const merged = { ...record, id: sid }
      if (invoiceApiEnabled) {
        try {
          await apiUpdateInvoiceRecord(sid, frontendInvoiceRecordToPayload(merged))
          await refetchInvoiceFromApi()
          showToast('发票记录已更新', 'success')
        } catch (e) {
          console.error(e)
          showToast('发票记录更新服务器失败', 'error')
        }
        return
      }
      setInvoiceRecords((prev) =>
        prev.map((item) => (String(item.id) === sid ? { ...merged, id: sid } : item))
      )
      showToast('发票记录已更新', 'success')
    },
    [invoiceApiEnabled, refetchInvoiceFromApi, showToast]
  )

  const handleDeleteInvoice = async (rawId) => {
    const sid = String(rawId)
    if (invoiceApiEnabled) {
      try {
        await apiDeleteInvoiceRecord(sid)
        await refetchInvoiceFromApi()
        showToast('发票记录已删除', 'success')
      } catch (e) {
        console.error(e)
        showToast('从服务器删除发票失败', 'error')
      }
      return
    }
    setInvoiceRecords((prev) => prev.filter((item) => String(item.id) !== sid))
    showToast('发票记录已删除', 'success')
  }

  const handleOpenVerification = (invoice) => {
    setSelectedInvoiceForVerification(invoice)
    setVerificationRecordIds(
      Array.isArray(invoice.verifiedRecordIds)
        ? invoice.verifiedRecordIds.map(String)
        : []
    )
    setShowVerificationDialog(true)
  }

  const handleConfirmVerification = React.useCallback(
    (verifiedSettlementTotal = 0) => {
      if (!selectedInvoiceForVerification) return
      const invId = String(selectedInvoiceForVerification.id)
      const ids = verificationRecordIds.map(String)
      const amt = parseFloat(verifiedSettlementTotal) || 0
      const next = {
        ...selectedInvoiceForVerification,
        verifiedRecordIds: ids,
        verified: ids.length > 0,
        verifiedAmount: amt
      }

      if (invoiceApiEnabled) {
        void (async () => {
          try {
            await apiUpdateInvoiceRecord(invId, frontendInvoiceRecordToPayload(next))
            await refetchInvoiceFromApi()
            setShowVerificationDialog(false)
            setSelectedInvoiceForVerification(null)
            setVerificationRecordIds([])
            showToast('核销成功', 'success')
          } catch (e) {
            console.error(e)
            showToast('核销同步服务器失败', 'error')
          }
        })()
        return
      }

      setInvoiceRecords((prev) =>
        prev.map((item) =>
          String(item.id) === invId
            ? {
                ...item,
                verifiedRecordIds: ids,
                verified: ids.length > 0,
                verifiedAmount: amt
              }
            : item
        )
      )
      setShowVerificationDialog(false)
      setSelectedInvoiceForVerification(null)
      setVerificationRecordIds([])
      showToast('核销成功', 'success')
    },
    [
      invoiceApiEnabled,
      refetchInvoiceFromApi,
      selectedInvoiceForVerification,
      verificationRecordIds,
      showToast
    ]
  )

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
      void (async () => {
        try {
          const data = JSON.parse(ev.target.result)
          if (!Array.isArray(data)) {
            showToast('文件格式不正确', 'error')
            return
          }
          const normalized = data.map((item) => ({
            ...item,
            invoiceDirection: inferInvoiceDirection(item),
            invoiceType: item.invoiceType || item.invoice_type || '',
            digitalInvoiceNo: item.digitalInvoiceNo || item.digital_invoice_no || '',
            invoiceCode: item.invoiceCode || item.invoice_code || '',
            invoiceNo: item.invoiceNo || item.invoice_no || '',
            sellerName: item.sellerName || item.seller_name || '',
            sellerTaxNo: item.sellerTaxNo || item.seller_tax_no || '',
            id: item.id != null ? String(item.id) : String(Date.now() + Math.random()),
            amount: parseFloat(item.amount || 0).toFixed(2),
            taxAmount: parseFloat(item.taxAmount || 0).toFixed(2),
            amountWithTax: parseFloat(item.amountWithTax || parseFloat(item.amount || 0) + parseFloat(item.taxAmount || 0)).toFixed(2),
            issuer: item.issuer != null ? String(item.issuer) : '',
            status: item.status || '未开',
            verified: Boolean(item.verified),
            verifiedRecordIds: Array.isArray(item.verifiedRecordIds)
              ? item.verifiedRecordIds.map(String)
              : [],
            verifiedAmount: parseFloat(item.verifiedAmount ?? item.verified_amount ?? 0) || 0
          }))

          if (invoiceApiEnabled) {
            try {
              for (const row of normalized) {
                await createInvoiceRecord(frontendInvoiceRecordToPayload(row))
              }
              await refetchInvoiceFromApi()
              showToast('发票记录已导入', 'success')
            } catch (err) {
              console.error(err)
              showToast('导入同步服务器失败', 'error')
            }
            return
          }

          setInvoiceRecords(normalized)
          showToast('发票记录已导入', 'success')
        } catch (err) {
          console.error(err)
          showToast('导入失败，文件格式错误', 'error')
        }
      })()
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
    invoiceApiEnabled,
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
    parseInvoiceFromFilename,
    refetchInvoiceFromApi
  }
}
