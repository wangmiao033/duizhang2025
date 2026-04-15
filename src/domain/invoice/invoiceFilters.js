/**
 * 发票列表筛选（销项/进项共用）
 */
export function filterInvoiceRecords(
  invoiceRecords,
  invoiceFilter = {
    direction: 'all',
    dateStart: '',
    dateEnd: '',
    status: '全部',
    invoiceType: '',
    companyKeyword: '',
    numberKeyword: ''
  }
) {
  const companyKw = String(invoiceFilter.companyKeyword || '')
    .trim()
    .toLowerCase()
  const numberKw = String(invoiceFilter.numberKeyword || '')
    .trim()
    .toLowerCase()
  const start = invoiceFilter.dateStart ? new Date(invoiceFilter.dateStart) : null
  const end = invoiceFilter.dateEnd ? new Date(invoiceFilter.dateEnd) : null

  return (invoiceRecords || []).filter((item) => {
    const direction = String(item.invoiceDirection || item.invoice_direction || 'output')
    if (invoiceFilter.direction && invoiceFilter.direction !== 'all' && direction !== invoiceFilter.direction) {
      return false
    }
    if (invoiceFilter.status !== '全部' && item.status !== invoiceFilter.status) return false
    if (invoiceFilter.invoiceType && String(item.invoiceType || '') !== String(invoiceFilter.invoiceType)) {
      return false
    }

    if (start || end) {
      const d = item.issueDate ? new Date(item.issueDate) : null
      if (!d || Number.isNaN(d.getTime())) return false
      if (start && d < start) return false
      if (end) {
        const endInclusive = new Date(end)
        endInclusive.setHours(23, 59, 59, 999)
        if (d > endInclusive) return false
      }
    }

    if (companyKw) {
      const companyBlob =
        `${item.title || ''} ${item.taxNo || ''} ${item.sellerName || ''} ${item.sellerTaxNo || ''}`.toLowerCase()
      if (!companyBlob.includes(companyKw)) return false
    }

    if (numberKw) {
      const numberBlob = `${item.invoiceNo || ''} ${item.digitalInvoiceNo || ''}`.toLowerCase()
      if (!numberBlob.includes(numberKw)) return false
    }

    return true
  })
}
