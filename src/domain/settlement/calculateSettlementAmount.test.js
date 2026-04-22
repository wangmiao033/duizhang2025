import { describe, it, expect } from 'vitest'
import {
  calculateSettlementAmount,
  calculateSettlementAmountRaw,
  formatSettlementAmountString,
  totalReconciliationSettlementAmount
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

  it('账单 Excel 回归：折后流水先算，再扣费，再乘通道与分成', () => {
    const v = calculateSettlementAmount({
      gameFlow: 33174989,
      testingFee: 0,
      voucher: 15488.35,
      channelFeeRate: 0,
      taxPoint: 0,
      revenueShareRatio: 15,
      discount: 0.005,
      refund: 0
    })
    expect(v).toBe(22557.99)
  })

  it('正常结算金额案例（新公式逐步结果一致）', () => {
    const v = calculateSettlementAmount(base)
    const discountedFlow = 100000 * 1
    const settlementBase = discountedFlow - 1000 - 500 - 0
    const amount = settlementBase * (1 - 0.025) * 0.5
    const expected = Math.max(0, Math.round(amount * 100) / 100)
    expect(v).toBe(expected)
    expect(v).toBe(48018.75)
  })

  it('有退款案例应不大于无退款', () => {
    const noRefund = calculateSettlementAmount(base)
    const withRefund = calculateSettlementAmount({ ...base, refund: 100 })
    expect(withRefund).toBeLessThan(noRefund)
    expect(withRefund).toBe(47970)
  })

  it('有折扣案例应小于无折扣', () => {
    const full = calculateSettlementAmount(base)
    const d = calculateSettlementAmount({ ...base, discount: 0.95 })
    expect(d).toBeLessThan(full)
  })

  it('税点不参与结算计算（与无税点结果相同）', () => {
    const withTax = calculateSettlementAmount(base)
    const noTax = calculateSettlementAmount({ ...base, taxPoint: 0 })
    expect(withTax).toBe(noTax)
  })

  it('结果小于 0 时保护为 0', () => {
    const v = calculateSettlementAmount({
      ...base,
      gameFlow: 100,
      refund: 999999
    })
    expect(v).toBe(0)
  })

  it('空值字段按 parseFloat 行为', () => {
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

  it('多游戏明细：总结算为各行 calculateSettlementAmount 之和', () => {
    const rec = {
      channelFeeRate: '2.5',
      items: [
        {
          revenue: 50000,
          discountRate: '1',
          testFee: '0',
          couponAmount: '0',
          extraFee: '0',
          shareRatio: '50'
        },
        {
          revenue: 50000,
          discountRate: '1',
          testFee: '0',
          couponAmount: '0',
          extraFee: '0',
          shareRatio: '50'
        }
      ]
    }
    const one = calculateSettlementAmount({
      gameFlow: 50000,
      testingFee: 0,
      voucher: 0,
      channelFeeRate: 2.5,
      taxPoint: 0,
      revenueShareRatio: 50,
      discount: 1,
      refund: 0
    })
    expect(totalReconciliationSettlementAmount(rec)).toBe(Math.round(one * 2 * 100) / 100)
  })

  it('多游戏明细汇总口径：先合计再四舍五入（避免逐行四舍五入累计误差）', () => {
    const rec = {
      channelFeeRate: '0',
      items: [
        { revenue: 1, discountRate: '1', testFee: '0', couponAmount: '0', extraFee: '0', shareRatio: '33.3333' },
        { revenue: 1, discountRate: '1', testFee: '0', couponAmount: '0', extraFee: '0', shareRatio: '33.3333' },
        { revenue: 1, discountRate: '1', testFee: '0', couponAmount: '0', extraFee: '0', shareRatio: '33.3333' }
      ]
    }
    const asSingle = {
      gameFlow: 1,
      testingFee: 0,
      voucher: 0,
      channelFeeRate: 0,
      taxPoint: 0,
      revenueShareRatio: 33.3333,
      discount: 1,
      refund: 0
    }
    const lineRounded = rec.items.reduce((sum) => {
      return sum + calculateSettlementAmount(asSingle)
    }, 0)
    const lineRaw = rec.items.reduce((sum) => {
      return sum + calculateSettlementAmountRaw(asSingle)
    }, 0)
    expect(Math.round(lineRounded * 100) / 100).toBe(0.99)
    expect(Math.round(lineRaw * 100) / 100).toBe(1.0)
    expect(totalReconciliationSettlementAmount(rec)).toBe(1.0)
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
    // 186500×0.97×0.6 在 IEEE 浮点下末位略低于 .3，ROUND 到分为 108543.00
    expect(calc).toBe(108543)
  })
})
