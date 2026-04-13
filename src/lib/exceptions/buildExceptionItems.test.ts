import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import { buildExceptionItems } from '@/lib/exceptions/buildExceptionItems.ts'
import { calculateSettlementAmount } from '@/domain/settlement/calculateSettlementAmount.js'

const lsStore: Record<string, string> = {}

beforeAll(() => {
  globalThis.localStorage = {
    getItem: (k: string) => (k in lsStore ? lsStore[k] : null),
    setItem: (k: string, v: string) => {
      lsStore[k] = v
    },
    removeItem: (k: string) => {
      delete lsStore[k]
    },
    clear: () => {
      for (const k of Object.keys(lsStore)) delete lsStore[k]
    },
    key: () => null,
    length: 0
  } as Storage
})

beforeEach(() => {
  localStorage.clear()
})

describe('buildExceptionItems', () => {
  it('flags invoice without links', () => {
    const items = buildExceptionItems({
      invoiceRecords: [{ id: 'inv-1', title: 'A公司', amount: '100.00' }],
      paymentRecords: [],
      links: [],
      reconciliationRecords: [],
      channelRecords: [],
      calculateSettlementAmount
    })
    expect(items.some((i) => i.type === 'invoice_unlinked')).toBe(true)
    expect(items.find((i) => i.type === 'invoice_unlinked')?.targetId).toBe('inv-1')
  })

  it('flags payment without links', () => {
    const items = buildExceptionItems({
      invoiceRecords: [],
      paymentRecords: [
        {
          id: 'pay-1',
          partnerName: '测试',
          trackingNumber: 'SF001',
          remark: ''
        }
      ],
      links: [],
      reconciliationRecords: [],
      channelRecords: [],
      calculateSettlementAmount
    })
    expect(items.some((i) => i.type === 'payment_unlinked')).toBe(true)
  })

  it('flags channel status outside allowed set', () => {
    const items = buildExceptionItems({
      invoiceRecords: [],
      paymentRecords: [],
      links: [],
      reconciliationRecords: [],
      channelRecords: [{ id: 'ch-1', channelName: 'C1', gameName: 'G1', status: 'weird' }],
      calculateSettlementAmount
    })
    expect(items.some((i) => i.type === 'channel_status_invalid')).toBe(true)
  })

  it('uses stable id for reconciliation issues', () => {
    const items = buildExceptionItems({
      invoiceRecords: [],
      paymentRecords: [],
      links: [],
      reconciliationRecords: [
        {
          id: 'rec-1',
          game: 'Game',
          settlementAmount: '-1',
          gameFlow: 100,
          testingFee: 0,
          voucher: 0,
          refund: 0,
          channelFeeRate: 0,
          taxPoint: 0,
          revenueShareRatio: 0.5,
          discount: 1
        }
      ],
      channelRecords: [],
      calculateSettlementAmount
    })
    const neg = items.find((i) => i.type === 'recon_settlement_negative')
    expect(neg).toBeDefined()
    expect(neg?.id).toContain('rec-1')
  })
})
