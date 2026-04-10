/**
 * 从文件名解析发票信息（原 App.jsx parseInvoiceFromFilename）
 */
export function parseInvoiceFromFilename(filename) {
  const nameWithoutExt = filename.replace(/\.(pdf|json)$/i, '')
  const parts = nameWithoutExt.split('+')

  if (parts.length >= 3) {
    const seller = parts[0]?.trim() || ''
    const buyer = parts[1]?.trim() || ''
    const amountMatch = parts[2]?.match(/(\d+\.?\d*)/)
    const dateMatch = parts[2]?.match(/(\d{8})/) || parts[3]?.match(/(\d{8})/)

    const amount = amountMatch ? amountMatch[1] : ''
    const dateStr = dateMatch ? dateMatch[1] : ''

    let formattedDate = ''
    if (dateStr && dateStr.length === 8) {
      formattedDate = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
    }

    return {
      title: buyer || seller,
      taxNo: '',
      amount,
      issueDate: formattedDate,
      status: '已开',
      remark: `销售方：${seller}`
    }
  }
  return null
}
