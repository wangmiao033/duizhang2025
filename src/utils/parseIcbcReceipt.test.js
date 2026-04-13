import { describe, expect, it } from 'vitest'
import {
  formatIcbcTimestamp,
  icbcToReceiptExtracted,
  normalizeIcbcText,
  parseIcbcReceiptText,
  parseAmountToNumber
} from './parseIcbcReceipt.js'

const SAMPLE_ICBC = `中国工商银行电子回单
电子回单号码  ABC123456789012
打印日期  2026-04-13
付款人户名 北京AA科技有限公司  收款人户名 上海BB贸易有限公司
付款账号 6222000011112222333 收款账号 6222000044445555666
付款人开户银行 中国工商银行北京分行  收款人开户银行 中国工商银行上海分行
金额 ￥22,557.99元  金额（大写）贰万贰��伍佰伍拾柒元玖角玖分
摘要  货款  用途  对公转账
交易流水号  ICBC-20260413-X001
时间戳 2026-04-13-18.54.08.714221
记账日期  2026-04-13
指令编号  ZL-778899

附言 指令编号：ZL-778899 提交人：张三 最终授权人：李四`

describe('parseIcbcReceiptText', () => {
  it('normalizes full-width spaces', () => {
    expect(normalizeIcbcText('a\u3000\u3000b')).toBe('a b')
  })

  it('formats ICBC timestamp', () => {
    const s = formatIcbcTimestamp('2026-04-13-18.54.08.714221')
    expect(s).toContain('2026-04-13')
    expect(s).toContain('18:54:08')
  })

  it('recognizes at least 8 core fields on table-style sample', () => {
    const r = parseIcbcReceiptText(SAMPLE_ICBC)
    expect(r.recognized).toBe(true)
    expect(r.coreFieldCount).toBeGreaterThanOrEqual(8)
    expect(r.fields.payerName).toContain('北京AA')
    expect(r.fields.payeeName).toContain('上海BB')
    expect(r.fields.amount).toBe('22557.99')
    expect(parseAmountToNumber(r.fields.amount)).toBe(22557.99)
    expect(r.fields.serialNo).toContain('ICBC')
    expect(r.fuyan.submitter).toBe('张三')
    expect(r.fuyan.finalApprover).toBe('李四')
  })

  it('icbcToReceiptExtracted maps for bank receipt merge', () => {
    const r = parseIcbcReceiptText(SAMPLE_ICBC)
    const ex = icbcToReceiptExtracted(r)
    expect(ex.payerName).toBeTruthy()
    expect(ex.payeeName).toBeTruthy()
    expect(ex.genericAmount).toBe('22557.99')
    expect(ex.expenseAmount).toBe('22557.99')
  })
})
