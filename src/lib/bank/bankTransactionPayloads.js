import { parseIcbcReceiptText } from '@/utils/parseIcbcReceipt.js'

function num(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function joinRaw(...parts) {
  return parts.filter((p) => p != null && String(p).trim() !== '').join('\n---\n')
}

/**
 * 研发对账付款确认单 → bank_transactions（payment_register）
 * @param {object} confirm
 * @param {string|number|null} confirm.remittanceAmount 汇款金额
 * @param {string|null} confirm.remittancePurpose 汇款用途
 * @param {string|null} confirm.paymentDate 汇款日期 YYYY-MM-DD
 * @param {string|null} confirm.payeeCompany 收款单位
 * @param {string|null} [confirm.remark] 备注（可选）
 * @param {string|null} [confirm.attachmentUrl] 回单附件 URL 或 API 路径
 * @param {string|null} [confirm.pasteText] 可选粘贴回单原文 → raw_text
 * @param {string|null} [confirm.payerName] 付款单位（默认本公司抬头）
 * @param {{ reconciliation_id: string, reconciliation_type?: string | null, reconciliation_no?: string | null, linked_amount: number | null } | null} rdLink
 */
export function buildRdPaymentConfirmPayload(confirm, rdLink) {
  const amt = num(confirm.remittanceAmount)
  const purpose =
    confirm.remittancePurpose != null ? String(confirm.remittancePurpose).trim() : ''
  const payee = confirm.payeeCompany != null ? String(confirm.payeeCompany).trim() : ''
  const payer =
    confirm.payerName != null && String(confirm.payerName).trim() !== ''
      ? String(confirm.payerName).trim()
      : null
  const remark =
    confirm.remark != null && String(confirm.remark).trim() !== ''
      ? String(confirm.remark).trim()
      : null
  const att =
    confirm.attachmentUrl != null && String(confirm.attachmentUrl).trim() !== ''
      ? String(confirm.attachmentUrl).trim()
      : null
  const raw =
    confirm.pasteText != null && String(confirm.pasteText).trim() !== ''
      ? String(confirm.pasteText).trim()
      : null

  const base = {
    type: 'payment_register',
    trade_date: confirm.paymentDate ? String(confirm.paymentDate).trim() : null,
    bank_account: null,
    payer_name: payer,
    payer_account: null,
    payer_bank_name: null,
    payee_name: payee || null,
    payee_account: null,
    payee_bank_name: null,
    amount: amt,
    income_amount: null,
    expense_amount: amt,
    currency: 'CNY',
    transaction_no: null,
    instruction_no: null,
    summary: purpose || null,
    purpose: purpose || null,
    remark,
    status: 'paid',
    raw_text: raw,
    attachment_url: att
  }

  const rid = rdLink?.reconciliation_id != null ? String(rdLink.reconciliation_id).trim() : ''
  if (rid) {
    base.reconciliation_id = rid
    base.reconciliation_type =
      rdLink?.reconciliation_type != null && String(rdLink.reconciliation_type).trim() !== ''
        ? String(rdLink.reconciliation_type).trim()
        : 'rd'
    base.reconciliation_no =
      rdLink?.reconciliation_no != null && String(rdLink.reconciliation_no).trim() !== ''
        ? String(rdLink.reconciliation_no).trim()
        : null
    const la = rdLink?.linked_amount
    base.linked_amount = la != null && Number.isFinite(Number(la)) ? Number(la) : null
  }
  return base
}

/**
 * @param {Record<string, unknown>} form BankCollectionRegisterPage 表单
 * @param {string} pasteText 粘贴区原文
 */
export function buildCollectionRegisterPayload(form, pasteText) {
  const icbc = parseIcbcReceiptText(pasteText || '')
  const instructionNo =
    icbc.recognized && icbc.fields?.instructionNo ? String(icbc.fields.instructionNo).trim() : ''
  const amt = num(form.amount)
  const tail = []
  if (form.channelProjectGame?.trim()) tail.push(`渠道/项目/游戏：${form.channelProjectGame.trim()}`)
  const remark = [form.remark != null ? String(form.remark).trim() : '', tail.join('\n')]
    .filter(Boolean)
    .join('\n')

  return {
    type: 'collection_register',
    trade_date: form.collectionDate ? String(form.collectionDate) : null,
    bank_account: form.collectionAccount ? String(form.collectionAccount).trim() : null,
    payer_name: form.payerName ? String(form.payerName).trim() : null,
    payer_account: null,
    payer_bank_name: null,
    payee_name: null,
    payee_account: null,
    payee_bank_name: null,
    amount: amt,
    income_amount: amt,
    expense_amount: null,
    currency: form.currency ? String(form.currency).trim() : 'CNY',
    transaction_no: form.bankSerialNo ? String(form.bankSerialNo).trim() : null,
    instruction_no: instructionNo || null,
    summary: null,
    purpose: null,
    remark: remark || null,
    status: form.claimStatus ? String(form.claimStatus) : null,
    raw_text: pasteText ? String(pasteText) : null,
    attachment_url: null
  }
}

/**
 * @param {Record<string, unknown>} form BankStatementImportPage 表单
 * @param {string} pasteText 键值粘贴区
 * @param {string} receiptText 回单粘贴区
 */
export function buildStatementImportPayload(form, pasteText, receiptText) {
  const inc = num(form.incomeAmount)
  const exp = num(form.expenseAmount)
  const counter = form.counterpartyName ? String(form.counterpartyName).trim() : ''
  const counterAcc = form.counterpartyAccount ? String(form.counterpartyAccount).trim() : ''

  let payerName = null
  let payeeName = null
  let payerAccount = null
  let payeeAccount = null
  if (inc != null && inc > 0) {
    payerName = counter || null
    payerAccount = counterAcc || null
  }
  if (exp != null && exp > 0) {
    payeeName = counter || null
    payeeAccount = counterAcc || null
  }
  if (!payerName && !payeeName && counter) {
    payerName = counter
    payerAccount = counterAcc || null
  }

  const primary = inc != null && inc > 0 ? inc : exp

  return {
    type: 'statement_import',
    trade_date: form.tradeDate ? String(form.tradeDate) : null,
    bank_account: form.bankAccount ? String(form.bankAccount).trim() : null,
    payer_name: payerName,
    payer_account: payerAccount,
    payer_bank_name: null,
    payee_name: payeeName,
    payee_account: payeeAccount,
    payee_bank_name: null,
    amount: primary,
    income_amount: inc,
    expense_amount: exp,
    currency: 'CNY',
    transaction_no: form.serialNo ? String(form.serialNo).trim() : null,
    instruction_no: null,
    summary: form.summary ? String(form.summary).trim() : null,
    purpose: null,
    remark: form.remark ? String(form.remark).trim() : null,
    status: null,
    raw_text: joinRaw(receiptText, pasteText) || null,
    attachment_url: null
  }
}
