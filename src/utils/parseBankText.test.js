import { describe, expect, it } from 'vitest'
import {
  cleanBankAmountString,
  looksLikePaymentSlipFields,
  parseBankText,
  parseBankBoolean
} from './parseBankText.js'

describe('parseBankText', () => {
  it('parses colons and strips amount', () => {
    const { fields, matchedLines } = parseBankText('汇款金额：22,557.99元\n交易序号: ABC-1')
    expect(matchedLines).toBe(2)
    expect(fields.remittance_amount).toBe('22557.99')
    expect(fields.transaction_serial).toBe('ABC-1')
  })

  it('supports english colon', () => {
    const { fields } = parseBankText('授权状态: 已通过')
    expect(fields.authorization_status).toBe('已通过')
  })

  it('detects payment slip for collection guard', () => {
    const { fields } = parseBankText('汇款单位：甲公司\n收款单位：乙公司')
    expect(looksLikePaymentSlipFields(fields)).toBe(true)
  })

  it('parseBankBoolean', () => {
    expect(parseBankBoolean('是')).toBe(true)
    expect(parseBankBoolean('否')).toBe(false)
    expect(parseBankBoolean('maybe')).toBe(null)
  })

  it('cleanBankAmountString', () => {
    expect(cleanBankAmountString('¥1,234.50元')).toBe('1234.50')
  })
})
