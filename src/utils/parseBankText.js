/**
 * 银行粘贴文本：按行「字段名: 值」解析，供流水 / 付款 / 回款页复用。
 * 支持 `:`、`：`；金额去逗号与「元」等；未识别行静默跳过。
 */

/** @type {Set<string>} */
const AMOUNT_FIELDS = new Set([
  'remittance_amount',
  'incomeAmount',
  'expenseAmount',
  'balance',
  'collection_amount'
])

/** @type {Set<string>} */
const BOOLEAN_FIELDS = new Set(['is_scheduled', 'is_personal_payee'])

/**
 * 规范化行首标签（去空白、统一 id 大小写）用于字典查找
 * @param {string} s
 */
export function normalizeBankLabel(s) {
  return String(s)
    .trim()
    .replace(/\s+/g, '')
    .replace(/ID/gi, 'id')
}

/**
 * 清洗金额类字符串：去千分位逗号、元、￥、空白
 * @param {string} raw
 */
export function cleanBankAmountString(raw) {
  return String(raw)
    .trim()
    .replace(/,/g, '')
    .replace(/元/g, '')
    .replace(/[¥￥\s]/g, '')
    .trim()
}

/**
 * @param {string} raw
 * @returns {boolean | null} null 表示无法识别，调用方应跳过不改表单
 */
export function parseBankBoolean(raw) {
  const s = String(raw).trim().toLowerCase()
  if (!s) return null
  if (/^(是|对|真|true|1|yes|y|要|已|有)$/.test(s)) return true
  if (/^(否|错|假|false|0|no|n|无|未)$/.test(s)) return false
  return null
}

/**
 * @param {string} raw
 * @returns {string} 尽量转为 yyyy-MM-dd；失败则返回去空白后的原串前10 位
 */
export function cleanBankDateInput(raw) {
  const s = String(raw).trim()
  const m = s.match(/(\d{4})\s*[-/.年]\s*(\d{1,2})\s*[-/.月]\s*(\d{1,2})/)
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  }
  const compact = s.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (compact) {
    return `${compact[1]}-${compact[2]}-${compact[3]}`
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  return s.slice(0, 10)
}

/**
 * @param {string} raw
 * @returns {string} 适配 datetime-local：YYYY-MM-DDTHH:mm
 */
export function cleanBankDateTimeLocal(raw) {
  const s = String(raw).trim()
  const m = s.match(
    /(\d{4})\s*[-/.年]\s*(\d{1,2})\s*[-/.月]\s*(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/
  )
  if (m) {
    const d = `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
    if (m[4] != null) {
      return `${d}T${m[4].padStart(2, '0')}:${(m[5] || '0').padStart(2, '0')}`
    }
    return `${d}T00:00`
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16)
  return cleanBankDateInput(s) + 'T00:00'
}

/**
 * 标签（已 normalizeBankLabel）→ 内部字段名
 * 含：付款单（用户清单）、流水导入、回款登记 常用别名
 */
const LABEL_TO_FIELD = (() => {
  /** @type {[string, string][]} */
  const pairs = [
    // —— 付款单（需求清单）——
    ['交易序号', 'transaction_serial'],
    ['授权状态', 'authorization_status'],
    ['支付提交人id', 'submitter_user_id'],
    ['第一授权人id', 'first_approver_user_id'],
    ['一次批复时间', 'first_approval_at'],
    ['汇款单位', 'remitter_company'],
    ['汇款账号', 'remitter_account'],
    ['汇款单位开户行名称', 'remitter_bank_name'],
    ['收款单位', 'payee_company'],
    ['收款账号', 'payee_account'],
    ['收款单位开户行名称', 'payee_bank_name'],
    ['汇款金额', 'remittance_amount'],
    ['汇款方式选择', 'remittance_method'],
    ['汇款用途', 'remittance_purpose'],
    ['备注', 'payment_remark'],
    ['银行反馈信息', 'bank_feedback'],
    ['指令受理渠道', 'instruction_channel'],
    ['是否向个人账户汇款', 'is_personal_payee'],
    ['预约执行', 'is_scheduled'],
    ['是否预约执行', 'is_scheduled'],
    ['打款日期', 'payment_date'],
    // —— 银行流水导入 ——
    ['交易日期', 'tradeDate'],
    ['银行账户', 'bankAccount'],
    ['对方户名', 'counterpartyName'],
    ['对方账号', 'counterpartyAccount'],
    ['摘要/用途', 'summary'],
    ['摘要', 'summary'],
    ['用途', 'summary'],
    ['收入金额', 'incomeAmount'],
    ['支出金额', 'expenseAmount'],
    ['余额', 'balance'],
    ['流水号', 'statement_serial_no'],
    // —— 回款登记 ——
    ['回款日期', 'collectionDate'],
    ['回款账户', 'collectionAccount'],
    ['回款金额', 'collection_amount'],
    ['对应渠道/项目/游戏', 'channelProjectGame'],
    ['对应渠道', 'channelProjectGame'],
    ['项目/游戏', 'channelProjectGame'],
    ['币种', 'currency'],
    ['打款方', 'payerName'],
    ['银行流水号', 'bank_reference_no'],
    ['认领状态', 'claimStatus']
  ]
  const out = {}
  for (const [zh, field] of pairs) {
    out[normalizeBankLabel(zh)] = field
  }
  return out
})()

const PAYMENT_SIGNAL_FIELDS = new Set([
  'remitter_company',
  'remitter_account',
  'remitter_bank_name',
  'payee_company',
  'payee_account',
  'payee_bank_name',
  'submitter_user_id',
  'first_approver_user_id',
  'authorization_status',
  'transaction_serial',
  'remittance_purpose',
  'instruction_channel',
  'remittance_method'
])

/**
 * 判断解析结果是否明显为「付款单」场景（回款页用于跳过误填）
 * @param {Record<string, unknown>} fields
 */
export function looksLikePaymentSlipFields(fields) {
  if (!fields || typeof fields !== 'object') return false
  let signals = 0
  for (const k of PAYMENT_SIGNAL_FIELDS) {
    const v = fields[k]
    if (v === true || v === false) {
      if (k === 'is_personal_payee' || k === 'is_scheduled') continue
    }
    if (v != null && String(v).trim() !== '') signals += 1
  }
  if (signals >= 2) return true
  const amt = String(fields.remittance_amount ?? '').trim()
  const hasParty = Boolean(
    (fields.remitter_company && String(fields.remitter_company).trim()) ||
      (fields.payee_company && String(fields.payee_company).trim())
  )
  if (amt && hasParty) return true
  return false
}

/**
 * 按字段类型清洗值
 * @param {string} field
 * @param {string} raw
 */
function cleanValueForField(field, raw) {
  if (BOOLEAN_FIELDS.has(field)) {
    return parseBankBoolean(raw)
  }
  if (field === 'first_approval_at') {
    return cleanBankDateTimeLocal(raw)
  }
  if (field === 'payment_date' || field === 'tradeDate' || field === 'collectionDate') {
    return cleanBankDateInput(raw)
  }
  if (AMOUNT_FIELDS.has(field)) {
    return cleanBankAmountString(raw)
  }
  return String(raw).trim()
}

/**
 * @param {string} text
 * @returns {{ fields: Record<string, string|boolean|null>, matchedLines: number }}
 */
export function parseBankText(text) {
  /** @type {Record<string, string|boolean|null>} */
  const fields = {}
  let matchedLines = 0
  const lines = String(text ?? '').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const m = trimmed.match(/^([^:：]+)[:：](.*)$/)
    if (!m) continue
    const labelKey = normalizeBankLabel(m[1])
    if (!labelKey) continue
    const field = LABEL_TO_FIELD[labelKey]
    if (!field) continue
    const rawVal = m[2]
    const cleaned = cleanValueForField(field, rawVal)
    if (cleaned === null && BOOLEAN_FIELDS.has(field)) {
      continue
    }
    fields[field] = cleaned
    matchedLines += 1
  }
  return { fields, matchedLines }
}
