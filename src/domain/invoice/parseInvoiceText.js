/**
 * 粘贴税务系统发票文本并解析为统一字段。
 */

function normalizeDate(input) {
  const text = String(input || '').trim()
  if (!text) return ''
  const m = text.match(/(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})/)
  if (!m) return ''
  const y = m[1]
  const mm = String(Number(m[2])).padStart(2, '0')
  const dd = String(Number(m[3])).padStart(2, '0')
  return `${y}-${mm}-${dd}`
}

function parseAmount(input) {
  const text = String(input || '').replace(/[^\d.-]/g, '').trim()
  if (!text) return ''
  const n = parseFloat(text)
  if (!Number.isFinite(n)) return ''
  return n.toFixed(2)
}

function cleanMaybeEmpty(v) {
  const text = String(v || '').trim()
  if (!text || text === '--' || text === '-') return ''
  return text
}

function mapInvoiceStatus(rawStatus) {
  const s = String(rawStatus || '').trim()
  if (!s) return '未开'
  if (s.includes('作废')) return '作废'
  if (s.includes('正常') || s.includes('已开') || s.includes('开具')) return '已开'
  return '未开'
}

/**
 * @param {string} rawText
 * @param {'output'|'input'} direction
 */
export function parseInvoiceText(rawText, direction = 'output') {
  const lines = String(rawText || '')
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean)

  if (lines.length < 8) return null

  const invoiceType = cleanMaybeEmpty(lines[0])
  const statusPrimary = cleanMaybeEmpty(lines[1])
  const digitalInvoiceNo = cleanMaybeEmpty(lines[2])
  const invoiceCode = cleanMaybeEmpty(lines[3])
  const invoiceNo = cleanMaybeEmpty(lines[4])
  const secondaryStatus = cleanMaybeEmpty(lines[5])
  const counterpartyName = cleanMaybeEmpty(lines[6])
  const counterpartyTaxNo = cleanMaybeEmpty(lines[7])
  const amount = parseAmount(lines[8])
  const taxAmount = parseAmount(lines[9])
  const totalAmount = parseAmount(lines[10]) || (
    amount && taxAmount ? (parseFloat(amount) + parseFloat(taxAmount)).toFixed(2) : ''
  )
  const invoiceDate = normalizeDate(lines[11])
  const actionType = cleanMaybeEmpty(lines[12])
  const invoiceSource = cleanMaybeEmpty(lines[13])
  const issuer = cleanMaybeEmpty(lines[14])

  const remarkExtras = [secondaryStatus, actionType].filter(Boolean)
  for (let i = 15; i < lines.length; i += 1) {
    const extra = cleanMaybeEmpty(lines[i])
    if (extra) remarkExtras.push(extra)
  }

  const base = {
    invoice_type: invoiceType,
    invoice_status: mapInvoiceStatus(statusPrimary),
    digital_invoice_no: digitalInvoiceNo,
    invoice_code: invoiceCode,
    invoice_no: invoiceNo,
    buyer_name: '',
    buyer_tax_no: '',
    seller_name: '',
    seller_tax_no: '',
    amount,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    invoice_date: invoiceDate,
    issuer,
    invoice_source: invoiceSource,
    remark: remarkExtras.join('；')
  }

  if (direction === 'input') {
    base.seller_name = counterpartyName
    base.seller_tax_no = counterpartyTaxNo
  } else {
    base.buyer_name = counterpartyName
    base.buyer_tax_no = counterpartyTaxNo
  }

  const hasKeyField =
    base.invoice_type ||
    base.digital_invoice_no ||
    base.buyer_name ||
    base.seller_name ||
    base.amount ||
    base.invoice_date

  return hasKeyField ? base : null
}

