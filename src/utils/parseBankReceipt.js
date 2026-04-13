/**
 * 电子回单 / 银行文本：键值模式 + 回单（关键词/正则）模式，本地解析无外部请求。
 */

import { icbcToReceiptExtracted, parseIcbcReceiptText } from './parseIcbcReceipt.js'

/** @typedef {'key-value' | 'receipt'} ReceiptInputMode */
/** @typedef {'payment' | 'collection' | 'unknown'} ReceiptDataKind */

/**
 * @param {string} raw
 * @returns {string}
 */
export function cleanReceiptAmount(raw) {
  return String(raw)
    .trim()
    .replace(/,/g, '')
    .replace(/元/g, '')
    .replace(/[¥￥\sCNYcny]/g, '')
    .replace(/^[^\d]*/, '')
    .replace(/[^\d.].*$/, '')
    .trim()
}

/**
 * 从全文抓取第一个合理金额（￥ 优先）
 * @param {string} text
 * @returns {string}
 */
export function extractPrimaryAmount(text) {
  const t = String(text)
  const yen = t.match(/[¥￥]\s*([\d,]+(?:\.\d{1,2})?)/)
  if (yen) return cleanReceiptAmount(yen[1])
  const labeled = t.match(
    /(?:汇款金额|转账金额|交易金额|金额(?:\([^)]*\))?|小写)[：:\s]*[¥￥]?\s*([\d,]+(?:\.\d{1,2})?)/i
  )
  if (labeled) return cleanReceiptAmount(labeled[1])
  return ''
}

/**
 * @param {string} line
 * @returns {{ key: string, value: string } | null}
 */
function splitKeyValueLine(line) {
  const trimmed = String(line).trim()
  if (!trimmed) return null
  const idxColon = trimmed.indexOf(':')
  const idxCn = trimmed.indexOf('：')
  let sep = -1
  if (idxColon >= 0 && idxCn >= 0) sep = Math.min(idxColon, idxCn)
  else sep = Math.max(idxColon, idxCn)
  if (sep < 0) return null
  const key = trimmed.slice(0, sep).trim().replace(/\s+/g, '')
  const value = trimmed.slice(sep + 1).trim()
  if (!key) return null
  return { key, value }
}

/**
 * 键值模式：按行解析 * @param {string} text
 */
function parseKeyValueMode(text) {
  /** @type {Record<string, string>} */
  const out = {}
  const lines = String(text).split(/\r?\n/)
  for (const line of lines) {
    const pair = splitKeyValueLine(line)
    if (!pair) continue
    const { key, value } = pair
    if (!value) continue

    if (/^付款人(?:户名|名称)?$/.test(key) || /^汇款人(?:户名|名称)?$/.test(key) || /^付款方(?:户名|名称)?$/.test(key)) {
      out.payerName = value
 continue
    }
    if (/^收款人(?:户名|名称)?$/.test(key) || /^收款方(?:户名|名称)?$/.test(key)) {
      out.payeeName = value
      continue
    }
    if (/付款人账号|付款账号|汇款账号|转出账号|付款方账号/.test(key)) {
      out.payerAccount = value.replace(/\s/g, '')
      continue
    }
    if (/收款人账号|收款账号|转入账号|收款方账号/.test(key)) {
      out.payeeAccount = value.replace(/\s/g, '')
      continue
    }
    if (/付款人开户|付款开户行|汇款开户|转出开户/.test(key)) {
      out.payerBank = value
      continue
    }
    if (/收款人开户|收款开户行|转入开户/.test(key)) {
      out.payeeBank = value
      continue
    }
    if (/收入金额|贷方发生额|转入金额|收款金额/.test(key)) {
      out.incomeAmount = cleanReceiptAmount(value)
      continue
    }
    if (/支出金额|借方发生额|转出金额|汇款金额|付款金额/.test(key)) {
      out.expenseAmount = cleanReceiptAmount(value)
      continue
    }
    if (/^(金额|小写金额)/.test(key) || /金额\(小写\)/.test(key)) {
      out.genericAmount = cleanReceiptAmount(value)
      continue
    }
    if (/摘要|用途|附言|备注/.test(key)) {
      out.summary = (out.summary ? `${out.summary}；` : '') + value
      continue
    }
    if (/交易流水号|银行流水号|日志号|凭证号/.test(key)) {
      out.serialNo = value.replace(/\s/g, '')
      continue
    }
    if (/指令编号|业务编号|网银流水|参考号|受理编号/.test(key)) {
      out.instructionNo = value.replace(/\s/g, '')
      continue
    }
    if (/记账日期|交易时间|交易日期|时间戳|日期/.test(key)) {
      out.tradeDateRaw = value
      continue
    }
  }
  return out
}

/**
 * 回单模式：全文关键词 + 正则（兼容工行等「标签：值」粘贴）
 * @param {string} text
 */
function parseReceiptKeywordMode(text) {
  const raw = String(text).replace(/\r/g, '\n')
  /** @type {Record<string, string>} */
  const out = {}

  const pick = (re, key) => {
    const m = raw.match(re)
    if (m && m[1]) {
      const v = m[1].trim()
      if (v && !out[key]) out[key] = v
    }
  }

  pick(/(?:付款人|汇款人|付款方)(?:[^\n]{0,12})?(?:户名|名称)[：:\s]+([^\n\r|]+?)(?=\s{2,}|\n|$)/, 'payerName')
  pick(/(?:收款人|收款方)(?:[^\n]{0,12})?(?:户名|名称)[：:\s]+([^\n\r|]+?)(?=\s{2,}|\n|$)/, 'payeeName')

  pick(/(?:付款人账号|付款账号|汇款账号|转出账号|付款方账号)[：:\s]+([\d\s\*\-]+)/, 'payerAccount')
  pick(/(?:收款人账号|收款账号|转入账号|收款方账号)[：:\s]+([\d\s\*\-]+)/, 'payeeAccount')

  pick(/(?:付款人开户银行|付款开户行|汇款开户行)[：:\s]+([^\n]+)/, 'payerBank')
  pick(/(?:收款人开户银行|收款开户行)[：:\s]+([^\n]+)/, 'payeeBank')

  pick(/(?:交易流水号|银行流水号|流水号|日志号|凭证号)[：:\s]+([A-Za-z0-9\-]+)/, 'serialNo')
  pick(/(?:指令编号|业务编号|受理编号|参考号)[：:\s]+([A-Za-z0-9\-]+)/, 'instructionNo')

  pick(/(?:记账日期|交易时间|交易日期)[：:\s]+([^\n]+)/, 'tradeDateRaw')
  if (!out.tradeDateRaw) {
    pick(/(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}(?:日)?(?:\s+\d{1,2}:\d{1,2}(?::\d{1,2})?)?)/, 'tradeDateRaw')
  }

  pick(/(?:摘要|用途|附言)[：:\s]+([^\n]+)/, 'summary')

  const inc = raw.match(/收入金额[：:\s]*[¥￥]?([\d,]+(?:\.\d{1,2})?)/)
  if (inc) out.incomeAmount = cleanReceiptAmount(inc[1])
  const exp = raw.match(/支出金额[：:\s]*[¥￥]?([\d,]+(?:\.\d{1,2})?)/)
  if (exp) out.expenseAmount = cleanReceiptAmount(exp[1])

  const gen = extractPrimaryAmount(raw)
  if (gen) out.genericAmount = gen

  const fuyan = raw.match(/附言[：:\s]*([\s\S]*?)(?=\n[^\s：:]+[：:]|$)/)
  if (fuyan && fuyan[1]) {
    const sub = fuyan[1].trim()
    if (sub) {
      const instr = sub.match(/(?:指令编号|业务编号)[：:\s]*([A-Za-z0-9\-]+)/)
      if (instr && !out.instructionNo) out.instructionNo = instr[1].trim()
    }
  }

  for (const k of ['payerAccount', 'payeeAccount', 'serialNo', 'instructionNo']) {
    if (out[k]) out[k] = String(out[k]).replace(/\s/g, '')
  }
  return out
}

/**
 * @param {string} raw
 * @returns {string} yyyy-MM-dd 或原串截断
 */
export function normalizeReceiptDateInput(raw) {
  const s = String(raw).trim()
  const m = s.match(/(\d{4})\s*[-/年]\s*(\d{1,2})\s*[-/月]\s*(\d{1,2})/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  const m2 = s.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`
  return s.slice(0, 10)
}

function mergeExtracted(a, b) {
  const out = { ...a }
  for (const [k, v] of Object.entries(b)) {
    if (v == null || String(v).trim() === '') continue
    if (!out[k]) out[k] = v
  }
  return out
}

/**
 * @param {Record<string, string>} ex
 * @param {string} fullText
 */
function classifyDataKind(ex, fullText) {
  const t = fullText
  const hasPayer = Boolean(
    (ex.payerName && ex.payerName.trim()) || /付款人|汇款人|付款方/.test(t)
  )
  const hasPayee = Boolean(
    (ex.payeeName && ex.payeeName.trim()) || /收款人|收款方/.test(t)
  )
  const hasRemitWord = /汇款金额|付款金额|金额\s*\(\s*小写\s*\)|借方金额|转出金额/.test(t)
  const hasIncomeLabel = /收入金额|转入金额|收款金额|贷方金额/.test(t)
  const hasIncomeAmount = Boolean(ex.incomeAmount && ex.incomeAmount.trim())

  if (hasPayee && hasIncomeAmount) {
    return /** @type {ReceiptDataKind} */ ('collection')
  }
  if (hasPayer && (/汇款金额/.test(t) || ex.expenseAmount)) {
    return 'payment'
  }
  if (hasPayer && hasRemitWord && ex.genericAmount && !hasIncomeAmount) {
    return 'payment'
  }
  if (hasPayee && hasIncomeLabel && ex.genericAmount && !ex.expenseAmount) {
    return 'collection'
  }
  if (hasPayer && ex.genericAmount && !hasIncomeAmount && !hasIncomeLabel) {
    return 'payment'
  }
  if (hasPayer && hasPayee && ex.genericAmount) {
    return hasIncomeLabel && !hasRemitWord ? 'collection' : 'payment'
  }
  return 'unknown'
}

/**
 * @param {ReceiptDataKind} kind
 * @param {Record<string, string>} ex
 */
function buildStatementFormPatch(kind, ex) {
  /** @type {Record<string, string>} */
  const patch = {}

  const tradeDate = ex.tradeDateRaw ? normalizeReceiptDateInput(ex.tradeDateRaw) : ''
  if (tradeDate && /^\d{4}-\d{2}-\d{2}$/.test(tradeDate)) patch.tradeDate = tradeDate

  if (kind === 'payment') {
    const amt = ex.expenseAmount || ex.genericAmount || ''
    if (amt) patch.expenseAmount = amt
    if (ex.payeeName) patch.counterpartyName = ex.payeeName.trim()
    if (ex.payeeAccount) patch.counterpartyAccount = ex.payeeAccount
    if (ex.summary) patch.summary = ex.summary.trim()
    if (ex.serialNo) patch.serialNo = ex.serialNo
    if (ex.payerAccount) patch.bankAccount = ex.payerAccount
    if (ex.instructionNo) patch.remark = `指令编号：${ex.instructionNo}`
    return patch
  }

  if (kind === 'collection') {
    const amt = ex.incomeAmount || ex.genericAmount || ''
    if (amt) patch.incomeAmount = amt
    if (ex.payerName) patch.counterpartyName = ex.payerName.trim()
    if (ex.payerAccount) patch.counterpartyAccount = ex.payerAccount
    if (ex.payeeAccount) patch.bankAccount = ex.payeeAccount
    if (ex.summary) patch.summary = ex.summary.trim()
    if (ex.serialNo) patch.serialNo = ex.serialNo
    return patch
  }

  if (ex.serialNo) patch.serialNo = ex.serialNo
  if (ex.summary) patch.summary = ex.summary.trim()
  if (ex.tradeDateRaw) {
    const td = normalizeReceiptDateInput(ex.tradeDateRaw)
    if (/^\d{4}-\d{2}-\d{2}$/.test(td)) patch.tradeDate = td
  }
  if (ex.genericAmount) patch.remark = `未分类金额：${ex.genericAmount}`
  return patch
}

function detectInputMode(text) {
  const lines = String(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return 'receipt'
  const kv = lines.filter((l) => splitKeyValueLine(l) != null).length
  if (lines.length >= 2 && kv / lines.length >= 0.35) return 'key-value'
  return 'receipt'
}

/**
 * @param {string} text
 * @returns {{
 *   inputMode: ReceiptInputMode,
 *   dataKind: ReceiptDataKind,
 *   extracted: Record<string, string>,
 *   formPatch: Record<string, string>,
 *   previewRows: { label: string, value: string }[],
 *   recognized: boolean
 * }}
 */
export function parseBankReceipt(text) {
  const raw = String(text ?? '').trim()
  const empty = {
    inputMode: /** @type {ReceiptInputMode} */ ('receipt'),
    dataKind: /** @type {ReceiptDataKind} */ ('unknown'),
    extracted: {},
    formPatch: {},
    previewRows: [],
    recognized: false
  }
  if (!raw) return empty

  const icbc = parseIcbcReceiptText(raw)

  const inputMode = detectInputMode(raw)
  const kv = parseKeyValueMode(raw)
  const rc = parseReceiptKeywordMode(raw)
  let extracted =
    inputMode === 'key-value' ? mergeExtracted(kv, rc) : mergeExtracted(rc, kv)
  if (icbc.recognized) {
    extracted = mergeExtracted(icbcToReceiptExtracted(icbc), extracted)
  }

  let dataKind = classifyDataKind(extracted, raw)
  if (
    icbc.recognized &&
    extracted.payerName &&
    extracted.payeeName &&
    (extracted.genericAmount || icbc.fields.amount)
  ) {
    dataKind = 'payment'
  }

  const formPatch = buildStatementFormPatch(dataKind, extracted)

  const recognized =
    Object.keys(extracted).length > 0 ||
    Object.keys(formPatch).length > 0 ||
    icbc.recognized

  const previewRows = [
    {
      label: '输入模式',
      value: icbc.recognized
        ? '工行表格式/混合'
        : inputMode === 'key-value'
          ? '键值行'
          : '回单/关键词'
    },
    {
      label: '数据类型',
      value:
        dataKind === 'payment'
          ? '付款数据（支出方向）'
          : dataKind === 'collection'
            ? '回款数据（收入方向）'
            : '未判定'
    }
  ]
  const add = (label, key) => {
    const v = extracted[key]
    if (v != null && String(v).trim() !== '') previewRows.push({ label, value: String(v).trim() })
  }
  add('付款人户名', 'payerName')
  add('收款人户名', 'payeeName')
  add('付款账号', 'payerAccount')
  add('收款账号', 'payeeAccount')
  add('付款开户行', 'payerBank')
  add('收款开户行', 'payeeBank')
  add('收入金额', 'incomeAmount')
  add('支出金额', 'expenseAmount')
  add('金额(通用)', 'genericAmount')
  add('摘要/用途', 'summary')
  add('交易流水号', 'serialNo')
  add('指令编号', 'instructionNo')
  add('日期/时间', 'tradeDateRaw')

  if (icbc.recognized) {
    const ic = icbc.fields
    const icAdd = (label, val) => {
      if (val != null && String(val).trim() !== '') {
        previewRows.push({ label, value: String(val).trim() })
      }
    }
    icAdd('【工行】电子回单号', ic.receiptNo)
    icAdd('【工行】打印日期', ic.printDate)
    icAdd('【工行】记账日期', ic.bookingDate)
    icAdd('【工行】时间戳', ic.timestampDisplay || ic.timestampRaw)
    icAdd('【工行】附言-提交人', icbc.fuyan?.submitter || ic.fuyanSubmitter)
    icAdd('【工行】附言-最终授权人', icbc.fuyan?.finalApprover || ic.fuyanFinalApprover)
    previewRows.push({
      label: '【工行】核心字段数',
      value: String(icbc.coreFieldCount)
    })
  }

  const formLabels = {
    tradeDate: '交易日期',
    bankAccount: '银行账户',
    counterpartyName: '对方户名',
    counterpartyAccount: '对方账号',
    summary: '摘要/用途',
    incomeAmount: '收入金额',
    expenseAmount: '支出金额',
    balance: '余额',
    serialNo: '流水号',
    remark: '备注'
  }
  previewRows.push({ label: '——将写入表单 ——', value: '' })
  for (const [k, v] of Object.entries(formPatch)) {
    if (v != null && String(v).trim() !== '') {
      previewRows.push({ label: formLabels[k] || k, value: String(v).trim() })
    }
  }

  return {
    inputMode,
    dataKind,
    extracted,
    formPatch,
    previewRows,
    recognized
  }
}
