/**
 * 工商银行等「表格式」电子回单文本解析（双栏、无冒号、关键词驱动）
 * （不 import parseBankReceipt，避免循环依赖）
 */

function cleanReceiptAmount(raw) {
  return String(raw)
    .trim()
    .replace(/,/g, '')
    .replace(/元/g, '')
    .replace(/[¥￥\sCNYcny]/g, '')
    .replace(/^[^\d]*/, '')
    .replace(/[^\d.].*$/, '')
    .trim()
}

function normalizeReceiptDateInput(raw) {
  const s = String(raw).trim()
  const m = s.match(/(\d{4})\s*[-/年]\s*(\d{1,2})\s*[-/月]\s*(\d{1,2})/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  const m2 = s.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`
  return s.slice(0, 10)
}

/**
 * 全角空格、tab、连续空格按行规整，保留换行
 * @param {string} text
 */
export function normalizeIcbcText(text) {
  return String(text ?? '')
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/\u3000/g, ' ')
        .replace(/\t/g, ' ')
        .replace(/[\u2000-\u200B]/g, ' ')
        .replace(/ +/g, ' ')
        .trim()
    )
    .join('\n')
}

/**
 * 2026-04-13-18.54.08.714221 → 可读 + 保留原值
 * @param {string} raw
 */
export function formatIcbcTimestamp(raw) {
  const s = String(raw).trim()
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})-(\d{2})\.(\d{2})\.(\d{2})\.(\d+)$/)
  if (m) {
    return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}（微秒 ${m[7]}）`
  }
  return s
}

/**
 * @param {string} raw
 * @returns {number | null}
 */
export function parseAmountToNumber(raw) {
  const s = cleanReceiptAmount(raw)
  if (!s) return null
  const n = Number.parseFloat(s)
  return Number.isFinite(n) ? n : null
}

/**
 * 附言块内提取
 * @param {string} text
 */
function extractFuyanBlock(text) {
  const raw = String(text)
  const m = raw.match(/附言\s*[：:]?\s*([\s\S]*?)(?=\n\s*(?:印章|验证码|打印|$)|$)/i)
  const block = (m ? m[1] : raw).trim()
  const pick = (labelRe) => {
    const x = block.match(labelRe)
    return x && x[1] ? x[1].trim() : ''
  }
  return {
    raw: block,
    instructionNo: pick(/(?:指令编号|业务编号)\s*[：:]?\s*([A-Za-z0-9\-]+)/),
    submitter: pick(/提交人\s*[：:]?\s*([^\s\n；;]+)/),
    finalApprover: pick(/最终授权人\s*[：:]?\s*([^\s\n；;]+)/)
  }
}

/**
 * 双栏：付款人户名 … 收款人户名 …
 * @param {string} line
 */
function dualPayerPayeeNames(line) {
  const r =
    /付款人\s*户名\s+(.+?)\s+收款人\s*户名\s+(.+)$/i
  const m = line.match(r)
  if (m) return { payer: m[1].trim(), payee: m[2].trim() }
  return null
}

function dualAccounts(line) {
  const r =
    /付款\s*账号\s+([\d\s\*\-]{6,})\s+收款\s*账号\s+([\d\s\*\-]{6,})/i
  const m = line.match(r)
  if (m)
    return {
      payer: m[1].replace(/\s/g, ''),
      payee: m[2].replace(/\s/g, '')
    }
  const r2 = /付款人账号\s+([\d\s\*\-]{6,})\s+收款人账号\s+([\d\s\*\-]{6,})/i
  const m2 = line.match(r2)
  if (m2)
    return {
      payer: m2[1].replace(/\s/g, ''),
      payee: m2[2].replace(/\s/g, '')
    }
  return null
}

function dualBanks(line) {
  const r =
    /付款人开户(?:银行|行)?\s+(.+?)\s+收款人开户(?:银行|行)?\s+(.+)$/i
  const m = line.match(r)
  if (m) return { payer: m[1].trim(), payee: m[2].trim() }
  const r2 = /开户银行\s+(.+?)\s+开户银行\s+(.+)$/i
  const m2 = line.match(r2)
  if (m2) return { payer: m2[1].trim(), payee: m2[2].trim() }
  return null
}

/**
 * @param {string} text normalized
 */
function scanSingletons(text, fields) {
  const set = (k, v) => {
    if (v == null || String(v).trim() === '') return
    if (!fields[k]) fields[k] = String(v).trim()
  }

  const pick = (re, key) => {
    const m = text.match(re)
    if (m && m[1]) set(key, m[1].trim())
  }

  pick(/电子回单(?:号码)?\s*[：:]?\s*([A-Za-z0-9\-]{4,})/i, 'receiptNo')
  pick(/打印日期\s*[：:]?\s*([^\n]+)/i, 'printDate')
  pick(/记账日期\s*[：:]?\s*([^\n]+)/i, 'bookingDate')
  pick(/交易流水号\s*[：:]?\s*([A-Za-z0-9\-]+)/i, 'serialNo')
  pick(/指令编号\s*[：:]?\s*([A-Za-z0-9\-]+)/i, 'instructionNo')

  const ts = text.match(/(\d{4}-\d{2}-\d{2}-\d{2}\.\d{2}\.\d{2}\.\d+)/)
  if (ts) {
    set('timestampRaw', ts[1])
    set('timestampDisplay', formatIcbcTimestamp(ts[1]))
  }

  pick(
    /摘要\s*[：:]?\s*([^\n]+?)(?=\s+交易流水号|\s+记账日期|\s+用途\s*[：:]|\n|$)/i,
    'summary'
  )
  pick(
    /用途\s*[：:]?\s*([^\n]+?)(?=\s+交易流水号|\s+记账日期|\s+摘要|\n|$)/i,
    'purpose'
  )

  const yen = text.match(/[¥￥]\s*([\d,]+(?:\.\d{1,2})?)\s*元?/)
  if (yen) set('amount', cleanReceiptAmount(yen[0]))

  if (!fields.amount) {
    const amt = text.match(
      /(?:金额|小写)\s*[（(]?[^）)]*[）)]?\s*[：:]?\s*[¥￥]?\s*([\d,]+(?:\.\d{1,2})?)\s*元?/i
    )
    if (amt) set('amount', cleanReceiptAmount(amt[1]))
  }

  if (!fields.payerName) {
    pick(/(?:付款人|汇款人)\s*户名\s*[：:]?\s*([^\n]+)/i, 'payerName')
  }
  if (!fields.payeeName) {
    pick(/收款人\s*户名\s*[：:]?\s*([^\n]+)/i, 'payeeName')
  }
}

/**
 * 解析工行风格电子回单全文
 * @param {string} text
 */
export function parseIcbcReceiptText(text) {
  const norm = normalizeIcbcText(text)
  /** @type {Record<string, string>} */
  const fields = {}

  if (!norm.trim()) {
    return {
      recognized: false,
      fields,
      amountNumeric: null,
      coreFieldCount: 0,
      fuyan: { raw: '', instructionNo: '', submitter: '', finalApprover: '' }
    }
  }

  const lines = norm.split('\n').filter(Boolean)
  const flat = lines.join('  ')

  for (const line of lines) {
    const pp = dualPayerPayeeNames(line)
    if (pp) {
      fields.payerName = pp.payer
      fields.payeeName = pp.payee
    }
    const ac = dualAccounts(line)
    if (ac) {
      fields.payerAccount = ac.payer
      fields.payeeAccount = ac.payee
    }
    const bk = dualBanks(line)
    if (bk) {
      fields.payerBank = bk.payer
      fields.payeeBank = bk.payee
    }
  }

  scanSingletons(norm, fields)
  scanSingletons(flat, fields)

  const fuyan = extractFuyanBlock(norm)
  if (fuyan.instructionNo && !fields.instructionNo) fields.instructionNo = fuyan.instructionNo
  if (fuyan.submitter) fields.fuyanSubmitter = fuyan.submitter
  if (fuyan.finalApprover) fields.fuyanFinalApprover = fuyan.finalApprover
  if (fuyan.raw) fields.fuyanRaw = fuyan.raw

  const amountNumeric = fields.amount ? parseAmountToNumber(fields.amount) : null

  const coreKeys = [
    'receiptNo',
    'printDate',
    'payerName',
    'payerAccount',
    'payerBank',
    'payeeName',
    'payeeAccount',
    'payeeBank',
    'amount',
    'summary',
    'purpose',
    'serialNo',
    'timestampRaw',
    'instructionNo',
    'bookingDate'
  ]
  let coreFieldCount = 0
  for (const k of coreKeys) {
    if (fields[k] && String(fields[k]).trim()) coreFieldCount += 1
  }

  const recognized =
    coreFieldCount >= 2 ||
    (fields.payerName && fields.payeeName) ||
    (fields.amount && fields.serialNo && (fields.payerName || fields.payeeName)) ||
    (/工商|ICBC|电子回单/.test(norm) && coreFieldCount >= 1)

  return {
    recognized,
    fields,
    amountNumeric,
    coreFieldCount,
    fuyan
  }
}

/**
 * 合并入 parseBankReceipt 使用的 extracted 形状
 * @param {ReturnType<typeof parseIcbcReceiptText>} icbc
 * @returns {Record<string, string>}
 */
export function icbcToReceiptExtracted(icbc) {
  if (!icbc.recognized) return {}
  const f = icbc.fields
  /** @type {Record<string, string>} */
  const ex = {}
  const copy = (k, v) => {
    if (v != null && String(v).trim() !== '') ex[k] = String(v).trim()
  }
  copy('payerName', f.payerName)
  copy('payeeName', f.payeeName)
  copy('payerAccount', f.payerAccount)
  copy('payeeAccount', f.payeeAccount)
  copy('payerBank', f.payerBank)
  copy('payeeBank', f.payeeBank)
  copy('serialNo', f.serialNo)
  copy('instructionNo', f.instructionNo)

  const amt = f.amount || ''
  if (amt) {
    ex.genericAmount = amt
    ex.expenseAmount = amt
  }

  const sum = [f.summary, f.purpose].filter(Boolean).join('；')
  if (sum) ex.summary = sum

  const dateRaw = f.bookingDate || f.printDate || ''
  if (dateRaw) ex.tradeDateRaw = dateRaw
  else if (f.timestampRaw) {
    const m = f.timestampRaw.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) ex.tradeDateRaw = `${m[1]}-${m[2]}-${m[3]}`
  }

  return ex
}

/**
 * 银行付款登记表单补丁
 * @param {ReturnType<typeof parseIcbcReceiptText>} icbc
 */
export function icbcToPaymentFormPatch(icbc) {
  if (!icbc.recognized) return {}
  const f = icbc.fields
  /** @type {Record<string, string | boolean>} */
  const patch = {}
  if (f.payerName) patch.remitter_company = f.payerName
  if (f.payerAccount) patch.remitter_account = f.payerAccount
  if (f.payerBank) patch.remitter_bank_name = f.payerBank
  if (f.payeeName) patch.payee_company = f.payeeName
  if (f.payeeAccount) patch.payee_account = f.payeeAccount
  if (f.payeeBank) patch.payee_bank_name = f.payeeBank
  if (f.amount) patch.remittance_amount = f.amount
  if (f.purpose) patch.remittance_purpose = f.purpose
  {
    const remarkParts = [f.summary, f.purpose].filter(Boolean)
    if (f.fuyanSubmitter) remarkParts.push(`提交人：${f.fuyanSubmitter}`)
    if (f.fuyanFinalApprover) remarkParts.push(`最终授权人：${f.fuyanFinalApprover}`)
    if (remarkParts.length) patch.payment_remark = remarkParts.join('；')
  }
  if (f.serialNo) patch.transaction_serial = f.serialNo
  if (f.instructionNo) patch.bank_feedback = `指令编号：${f.instructionNo}`
  if (f.bookingDate) {
    const d = normalizeReceiptDateInput(f.bookingDate)
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) patch.payment_date = d
  }
  if (f.fuyanSubmitter) patch.submitter_user_id = f.fuyanSubmitter
  if (f.fuyanFinalApprover) patch.first_approver_user_id = f.fuyanFinalApprover
  return patch
}

/**
 * 银行回款登记：仅共用字段（付款回单场景）
 * @param {ReturnType<typeof parseIcbcReceiptText>} icbc
 */
export function icbcToCollectionFormPatch(icbc) {
  if (!icbc.recognized) return {}
  const f = icbc.fields
  /** @type {Record<string, string>} */
  const patch = {}
  if (f.amount) patch.amount = f.amount
  if (f.payeeName) patch.payerName = f.payeeName
  if (f.serialNo) patch.bankSerialNo = f.serialNo
  const dateRaw = f.bookingDate || f.printDate || ''
  if (dateRaw) {
    const d = normalizeReceiptDateInput(dateRaw)
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) patch.collectionDate = d
  }
  const remarkParts = []
  if (f.instructionNo) remarkParts.push(`指令编号：${f.instructionNo}`)
  if (f.fuyanSubmitter) remarkParts.push(`提交人：${f.fuyanSubmitter}`)
  if (f.fuyanFinalApprover) remarkParts.push(`最终授权人：${f.fuyanFinalApprover}`)
  if (f.summary) remarkParts.push(`摘要：${f.summary}`)
  if (f.purpose) remarkParts.push(`用途：${f.purpose}`)
  if (f.timestampDisplay) remarkParts.push(`时间：${f.timestampDisplay}`)
  if (f.receiptNo) remarkParts.push(`电子回单号：${f.receiptNo}`)
  if (remarkParts.length) patch.remark = remarkParts.join('；')
  return patch
}
