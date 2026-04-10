/**
 * 导出前数据结构组装（不改变下游 ExportButton / 文件格式，仅集中 JSON 备份类导出）
 */

export function buildFullDataBackupPayload({
  records,
  partyA,
  partyB,
  settlementMonth,
  partners,
  deliveries,
  exportDate = new Date().toISOString()
}) {
  return {
    records,
    partyA,
    partyB,
    settlementMonth,
    partners,
    deliveries,
    exportDate
  }
}

export function buildFilteredExportPayload({
  filteredRecords,
  partyA,
  partyB,
  settlementMonth,
  totalRecordsCount,
  searchTerm,
  filterOptions,
  sortOptions,
  exportDate = new Date().toISOString()
}) {
  return {
    records: filteredRecords,
    partyA,
    partyB,
    settlementMonth,
    exportDate,
    filterInfo: {
      searchTerm,
      filterOptions,
      sortOptions,
      totalRecords: totalRecordsCount,
      filteredRecords: filteredRecords.length
    }
  }
}

export function buildSelectedRecordsExportPayload({
  selectedRecords,
  partyA,
  partyB,
  settlementMonth,
  selectedCount,
  exportDate = new Date().toISOString()
}) {
  return {
    records: selectedRecords,
    partyA,
    partyB,
    settlementMonth,
    exportDate,
    selectedCount
  }
}

export function downloadJsonBlob(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** 发票 CSV 行（与 App.jsx handleExportInvoiceCSV 表头、列顺序一致） */
export function buildInvoiceCsvContent(invoiceRecords) {
  const headers = ['抬头', '税号', '金额', '状态', '开票日期', '备注']
  const rows = (invoiceRecords || []).map((r) => [
    `"${r.title || ''}"`,
    `"${r.taxNo || ''}"`,
    r.amount || '0.00',
    r.status || '',
    r.issueDate || '',
    `"${r.remark || ''}"`
  ])
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}
