import { describe, it, expect } from 'vitest'
import {
  calculateSettlementAmount,
  formatSettlementAmountString
} from '@/domain/settlement/calculateSettlementAmount.js'

describe('calculateSettlementAmount', () => {
  const base = {
    gameFlow: 100000,
    testingFee: 1000,
    voucher: 500,
    channelFeeRate: 2.5,
    taxPoint: 6,
    revenueShareRatio: 50,
    discount: 1,
    refund: 0
  }

  it('正常结算金额案例（与公式逐步结果一致）', () => {
    const v = calculateSettlementAmount(base)
    const baseAmount = 100000 - 1000 - 500
    const afterChannelFee = baseAmount * (1 - 0.025)
    const afterTax = afterChannelFee * (1 - 0.06)
    const afterShare = afterTax * 0.5
    const afterDiscount = afterShare * 1
    const finalAmount = afterDiscount - 0
    const expected = Math.max(0, Math.round(finalAmount * 100) / 100)
    expect(v).toBe(expected)
    expect(v).toBe(45137.63)
  })

  it('有退款案例应不大于无退款', () => {
    const noRefund = calculateSettlementAmount(base)
    const withRefund = calculateSettlementAmount({ ...base, refund: 100 })
    expect(withRefund).toBeLessThan(noRefund)
    expect(withRefund).toBe(45037.63)
  })

  it('有折扣案例应小于无折扣', () => {
    const full = calculateSettlementAmount(base)
    const d = calculateSettlementAmount({ ...base, discount: 0.95 })
    expect(d).toBeLessThan(full)
  })

  it('有税点案例（与无税点对比应更小）', () => {
    const withTax = calculateSettlementAmount(base)
    const noTax = calculateSettlementAmount({ ...base, taxPoint: 0 })
    expect(withTax).toBeLessThan(noTax)
  })

  it('结果小于 0 时保护为 0', () => {
    const v = calculateSettlementAmount({
      ...base,
      gameFlow: 100,
      refund: 999999
    })
    expect(v).toBe(0)
  })

  it('空值字段按旧逻辑 parseFloat 行为（与历史实现一致）', () => {
    const v = calculateSettlementAmount({
      gameFlow: '',
      testingFee: undefined,
      voucher: null,
      channelFeeRate: '',
      taxPoint: '',
      revenueShareRatio: '',
      discount: '',
      refund: ''
    })
    expect(typeof v).toBe('number')
    expect(v).toBe(0)
  })

  it('批量修改后金额一致：同一记录重复计算相同', () => {
    const r = { ...base, gameFlow: 88888 }
    const a = formatSettlementAmountString(r)
    const b = formatSettlementAmountString(r)
    expect(a).toBe(b)
    expect(parseFloat(a)).toBe(calculateSettlementAmount(r))
  })

  it('导入后重算：字符串金额与数值计算一致', () => {
    const imported = {
      gameFlow: 200000,
      testingFee: 2000,
      voucher: 1000,
      channelFeeRate: 3,
      taxPoint: 6,
      revenueShareRatio: 60,
      discount: 0.95,
      refund: 500
    }
    const calc = calculateSettlementAmount(imported)
    const str = formatSettlementAmountString(imported)
    expect(str).toBe(calc.toFixed(2))
  })
})
