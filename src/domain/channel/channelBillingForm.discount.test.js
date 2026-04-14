import { describe, expect, it } from 'vitest'
import { effectiveLineFlowFromFormData, calculateBillingAmount, buildLineRecordFromForm } from './channelBillingForm.js'

describe('discount factor / 总流水', () => {
  it('2512058 × 0.005 = 12560.29', () => {
    const row = { flow: '2512058', discountFactor: '0.005', voucherCost: '0', noWorryCost: '0', refundCost: '0', testCost: '0', welfareCost: '0' }
    expect(effectiveLineFlowFromFormData(row)).toBe(12560.29)
  })

  it('计费以折算后流水为基准（无抵扣时计费额=总流水）', () => {
    const row = {
      flow: '2512058',
      discountFactor: '0.005',
      voucherCost: '0',
      noWorryCost: '0',
      refundCost: '0',
      testCost: '0',
      welfareCost: '0',
      shareRate: '30',
      taxRate: '5',
      gatewayCost: '0',
      settlementAmount: ''
    }
    expect(calculateBillingAmount(row)).toBe(12560.29)
    const line = buildLineRecordFromForm(row)
    expect(line.billingAmount).toBe(12560.29)
    expect(line.flow).toBe(2512058)
    expect(line.discountFactor).toBe(0.005)
    expect(line.effectiveFlow).toBe(12560.29)
  })
})
