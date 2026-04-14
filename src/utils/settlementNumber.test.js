import { describe, expect, it } from 'vitest'
import {
  displaySettlementNumber,
  ensureValidDate,
  generateSettlementNumber,
  isCorruptSettlementNumber,
  nextSettlementNumberForRecord,
  parseSettlementMonthToDate,
  resolveDateForSettlementNumber
} from './settlementNumber.js'

describe('parseSettlementMonthToDate', () => {
  it('parses YYYY-MM', () => {
    const d = parseSettlementMonthToDate('2026-04')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(3)
    expect(d.getDate()).toBe(1)
  })

  it('parses YYYY-MM-DD without duplicating -01', () => {
    const d = parseSettlementMonthToDate('2026-04-14')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(3)
    expect(d.getDate()).toBe(14)
  })

  it('returns null for garbage', () => {
    expect(parseSettlementMonthToDate('')).toBeNull()
    expect(parseSettlementMonthToDate('2026-13-01')).toBeNull()
    expect(parseSettlementMonthToDate('not-a-date')).toBeNull()
  })
})

describe('ensureValidDate', () => {
  it('replaces Invalid Date', () => {
    const bad = new Date('2026-04-14-01')
    expect(Number.isNaN(bad.getTime())).toBe(true)
    const fixed = ensureValidDate(bad)
    expect(Number.isNaN(fixed.getTime())).toBe(false)
  })
})

describe('generateSettlementNumber', () => {
  it('never embeds NaN for DATE_SEQUENCE (invalid Date in)', () => {
    const bad = new Date(NaN)
    const n = generateSettlementNumber([], bad, 'DATE_SEQUENCE', null)
    expect(n).toMatch(/^JS-\d{8}-\d{3}$/)
    expect(n.includes('NaN')).toBe(false)
  })

  it('increments sequence for same YYYYMMDD prefix', () => {
    const d = new Date(2026, 3, 14)
    const first = generateSettlementNumber([], d, 'DATE_SEQUENCE', null)
    const second = generateSettlementNumber(
      [{ settlementNumber: first, id: '1' }],
      d,
      'DATE_SEQUENCE',
      null
    )
    expect(first).toMatch(/^JS-20260414-001$/)
    expect(second).toBe('JS-20260414-002')
  })
})

describe('nextSettlementNumberForRecord', () => {
  it('ignores corrupt manual number and regenerates', () => {
    const n = nextSettlementNumberForRecord(
      { settlementNumber: 'JS-NaNNaNNaN-001', settlementMonth: '2026-04', partner: 'P' },
      [],
      'DATE_SEQUENCE'
    )
    expect(isCorruptSettlementNumber(n)).toBe(false)
    expect(n).toMatch(/^JS-\d{8}-\d{3}$/)
  })
})

describe('displaySettlementNumber', () => {
  it('shows 未生成 for corrupt', () => {
    expect(displaySettlementNumber('JS-NaNNaNNaN-001')).toBe('未生成')
  })
})

describe('resolveDateForSettlementNumber', () => {
  it('falls back to today when month missing', () => {
    const d = resolveDateForSettlementNumber('')
    expect(Number.isNaN(d.getTime())).toBe(false)
  })
})
