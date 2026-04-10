/**
 * 发票列表筛选（原 App.jsx filteredInvoices useMemo）
 */
export function filterInvoiceRecords(invoiceRecords, invoiceFilter = { keyword: '', status: '全部' }) {
  const kw = (invoiceFilter.keyword || '').trim().toLowerCase()
  return (invoiceRecords || []).filter((item) => {
    const matchStatus =
      invoiceFilter.status === '全部' || item.status === invoiceFilter.status
    const matchKeyword =
      !kw ||
      `${item.title || ''} ${item.taxNo || ''} ${item.remark || ''}`.toLowerCase().includes(kw)
    return matchStatus && matchKeyword
  })
}
