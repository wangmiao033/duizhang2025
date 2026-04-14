import { parseIcbcReceiptText } from '@/utils/parseIcbcReceipt.js'

function num(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function joinRaw(...parts) {
  return parts.filter((p) => p != null && String(p).trim() !== '').join('\n---\n')
}

function paymentExtraRemark(form) {
  const lines = []
  if (form.authorization_status?.trim()) lines.push(`授权状态：${form.authorization_status.trim()}`)
  if (form.remittance_method?.trim()) lines.push(`汇款方式：${form.remittance_method.trim()}`)
  if (form.instruction_channel?.trim()) lines.push(`指令受理渠道：${form.instruction_channel.trim()}`)
  if (form.submitter_user_id?.trim()) lines.push(`支付提交人ID：${form.submitter_user_id.trim()}`)
  if (form.first_approver_user_id?.trim()) lines.push(`第一授权人ID：${form.first_approver_user_id.trim()}`)
  if (form.first_approval_at?.trim()) lines.push(`一次批复时间：${form.first_approval_at.trim()}`)
  if (form.bank_feedback?.trim()) lines.push(`银行反馈：${form.bank_feedback.trim()}`)
  if (form.is_scheduled) lines.push('预约执行：是')
  if (form.is_personal_payee) lines.push('向个人账户汇款：是')
  return lines.length ? lines.join('\n') : ''
}

/**
 * @param {Record<string, unknown>} form BankPaymentRegisterPage 表单
 * @param {string} pasteText 粘贴区原文（工行回单等）
 * @param {{ reconciliation_id?: string | null, reconciliation_type?: string | null, reconciliation_no?: string | null, linked_amount?: number | null } | null} [rdLink] 关联研发对账
 */
export function buildPaymentRegisterPayload(form, pasteText, rdLink) {
  const icbc = parseIcbcReceiptText(pasteText || '')
  const instructionNo =
    icbc.recognized && icbc.fields?.instructionNo ? String(icbc.fields.instructionNo).trim() : ''

  const amt = num(form.remittance_amount)
  const baseRemark = form.payment_remark != null ? String(form.payment_remark).trim() : ''
  const extra = paymentExtraRemark(form)
  const remark = [baseRemark, extra].filter(Boolean).join('\n\n')

  const base = {
    type: 'payment_register',
    trade_date: form.payment_date ? String(form.payment_date) : null,
    bank_account: form.remitter_account ? String(form.remitter_account).trim() : null,
    payer_name: form.remitter_company ? String(form.remitter_company).trim() : null,
    payer_account: form.remitter_account ? String(form.remitter_account).trim() : null,
    payer_bank_name: form.remitter_bank_name ? String(form.remitter_bank_name).trim() : null,
    payee_name: form.payee_company ? String(form.payee_company).trim() : null,
    payee_account: form.payee_account ? String(form.payee_account).trim() : null,
    payee_bank_name: form.payee_bank_name ? String(form.payee_bank_name).trim() : null,
    amount: amt,
    income_amount: null,
    expense_amount: amt,
    currency: 'CNY',
    transaction_no: form.transaction_serial ? String(form.transaction_serial).trim() : null,
    instruction_no: instructionNo || null,
    summary: form.remittance_purpose ? String(form.remittance_purpose).trim() : null,
    purpose: form.remittance_purpose ? String(form.remittance_purpose).trim() : null,
    remark: remark || null,
    status: form.transfer_status ? String(form.transfer_status) : null,
    raw_text: pasteText ? String(pasteText) : null,
    attachment_url: null
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
