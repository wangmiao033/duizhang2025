import { describe, expect, it } from 'vitest'
import { cleanReceiptAmount, parseBankReceipt } from './parseBankReceipt.js'

describe('parseBankReceipt', () => {
  it('cleanReceiptAmount strips ￥ comma元', () => {
    expect(cleanReceiptAmount('￥22,557.99元')).toBe('22557.99')
  })

  it('ICBC-like electronic receipt (receipt mode)', () => {
    const text = `中国工商银行电子回单
付款人户名：北京某某科技有限公司
付款人账号：6222020200012345678
收款人户名：上海贸易有限公司
收款人账号：6222020200087654321
金额(小写)：￥12,345.67元
摘要：货款
交易流水号：ICBC20250101123456
记账日期：2025-01-15`
    const r = parseBankReceipt(text)
    // 工行回单多为「标签：值」分行，检测为键值模式；与回单关键词解析结果一致
    expect(['key-value', 'receipt']).toContain(r.inputMode)
    expect(r.dataKind).toBe('payment')
    expect(r.formPatch.expenseAmount).toBe('12345.67')
    expect(r.formPatch.counterpartyName).toBe('上海贸易有限公司')
    expect(r.formPatch.summary).toBe('货款')
    expect(r.formPatch.serialNo).toBe('ICBC20250101123456')
    expect(r.formPatch.bankAccount).toBe('6222020200012345678')
    expect(r.formPatch.tradeDate).toBe('2025-01-15')
  })

  it('key-value lines with income', () => {
    const text = `收款人户名：乙公司
收入金额：3,000.50
交易流水号：SN999`
    const r = parseBankReceipt(text)
    expect(r.dataKind).toBe('collection')
    expect(r.formPatch.incomeAmount).toBe('3000.50')
    expect(r.formPatch.serialNo).toBe('SN999')
  })

  it('empty text is tolerant', () => {
    const r = parseBankReceipt('   ')
    expect(r.recognized).toBe(false)
    expect(r.formPatch).toEqual({})
  })
})
