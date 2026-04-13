/**
 * 从回款登记文本中抽取金额候选（与后端 invoice_payment_link._extract_amount_candidates 对齐）
 */

export function extractAmountCandidates(text: string): number[] {
  if (!text) return []
  const t = text.replace(/,/g, '').replace(/，/g, '')
  const out: number[] = []
  const re = /(?:¥|￥|元|^|[\s:：，,])\s*(\d+(?:\.\d+)?)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(t)) !== null) {
    const n = parseFloat(m[1])
    if (Number.isFinite(n)) out.push(n)
  }
  return out
}

export function paymentRecordToAmountSearchBlob(record: Record<string, unknown>): string {
  const parts = [
    record.courierCompany,
    record.partnerName,
    record.recipient,
    record.remark,
    record.trackingNumber
  ]
    .filter((x) => x != null && String(x).trim() !== '')
    .map((x) => String(x))
  return parts.join(' ')
}
