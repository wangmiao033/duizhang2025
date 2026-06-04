import React, { useEffect, useMemo, useState } from 'react'
import { listQuickSdkRdLines } from '@/lib/api/quicksdk.ts'

function currentMonthValue() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function normalizeMonthValue(raw) {
  const text = raw == null ? '' : String(raw).trim()
  if (!text) return currentMonthValue()
  let m = text.match(/^(\d{4})-(\d{1,2})$/)
  if (m) return `${m[1]}-${String(Math.min(Math.max(Number(m[2]), 1), 12)).padStart(2, '0')}`
  m = text.match(/^(\d{4})年(\d{1,2})月$/)
  if (m) return `${m[1]}-${String(Math.min(Math.max(Number(m[2]), 1), 12)).padStart(2, '0')}`
  m = text.match(/^(\d{4})(\d{2})$/)
  if (m) return `${m[1]}-${String(Math.min(Math.max(Number(m[2]), 1), 12)).padStart(2, '0')}`
  return currentMonthValue()
}

function monthValueToCycle(raw) {
  const text = normalizeMonthValue(raw)
  const m = text.match(/^(\d{4})-(\d{2})$/)
  return m ? `${m[1]}年${Number(m[2])}月` : text
}

function formatMoney(value) {
  const n = Number(value || 0)
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatLineNumber(value) {
  const n = Number(value || 0)
  if (!Number.isFinite(n)) return '0'
  return String(Math.round(n * 100) / 100)
}

function buildLineItems(items, month) {
  const cycle = monthValueToCycle(month)
  return items.map((item, index) => ({
    settlementCycle: cycle,
    gameName: item.game_name || '',
    revenue: formatLineNumber(item.total_flow),
    discountRate: '1',
    couponAmount: '0',
    testFee: '0',
    extraFee: '0',
    shareRatio: '15',
    taxRate: '0',
    sortOrder: index,
    quicksdkFlow: Number(item.total_flow || 0),
    quicksdkFlowMonth: item.settlement_month || month,
    quicksdkRowCount: item.row_count || 0,
    quicksdkChannelCount: item.channel_count || 0,
    quicksdkSourceGameCount: item.source_game_count || 0,
    quicksdkTopChannel: item.top_channel || ''
  }))
}

function buildTsv(items) {
  const rows = [
    ['游戏名称', '月份', '流水', '流水行数', '渠道数', '最高渠道', '最高渠道流水'],
    ...items.map((item) => [
      item.game_name || '',
      item.settlement_month || '',
      formatLineNumber(item.total_flow),
      String(item.row_count || 0),
      String(item.channel_count || 0),
      item.top_channel || '',
      formatLineNumber(item.top_channel_flow)
    ])
  ]
  return rows.map((row) => row.join('\t')).join('\n')
}

function downloadCsv(items, month) {
  const csv = buildTsv(items).replace(/\t/g, ',')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `QuickSDK研发账单取数-${month}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function QuickSdkRdBillingTool({ defaultMonth, onCreateBill, onNotify }) {
  const [month, setMonth] = useState(() => normalizeMonthValue(defaultMonth))
  const [query, setQuery] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    setMonth(normalizeMonthValue(defaultMonth))
  }, [defaultMonth])

  const visibleItems = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return items
    return items.filter((item) => String(item.game_name || '').toLowerCase().includes(keyword))
  }, [items, query])

  const totalFlow = useMemo(
    () => visibleItems.reduce((sum, item) => sum + Number(item.total_flow || 0), 0),
    [visibleItems]
  )

  const loadItems = async () => {
    if (!month) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await listQuickSdkRdLines({ settlement_month: month, limit: 500 })
      const nextItems = (res.items || []).filter((item) => Number(item.total_flow || 0) > 0)
      setItems(nextItems)
      setMessage({ type: 'ok', text: `${month} 已读取 ${nextItems.length} 个产品` })
    } catch (err) {
      setItems([])
      setMessage({
        type: 'warn',
        text: err instanceof Error ? err.message : 'QuickSDK 流水读取失败'
      })
    } finally {
      setLoading(false)
    }
  }

  const createBill = () => {
    if (visibleItems.length === 0) {
      setMessage({ type: 'warn', text: '请先读取有流水的月份' })
      return
    }
    onCreateBill?.({
      settlementMonth: monthValueToCycle(month),
      rdLines: buildLineItems(visibleItems, month)
    })
  }

  return (
    <section className="rd-quicksdk-tool" aria-label="QuickSDK 研发账单取数">
      <div className="rd-quicksdk-tool__bar">
        <div className="rd-quicksdk-tool__title">
          <h3>QuickSDK 研发账单取数</h3>
          <p>按月份汇总产品流水。</p>
        </div>
        <div className="rd-quicksdk-tool__fields">
          <label>
            <span>月份</span>
            <input
              type="month"
              className="admin-input"
              value={month}
              onChange={(e) => setMonth(normalizeMonthValue(e.target.value))}
            />
          </label>
          <label>
            <span>产品</span>
            <input
              type="text"
              className="admin-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="游戏名称"
            />
          </label>
        </div>
        <div className="rd-quicksdk-tool__actions">
          <button type="button" className="rec-btn rec-btn--secondary" onClick={loadItems} disabled={loading}>
            {loading ? '读取中' : '读取'}
          </button>
          <button
            type="button"
            className="rec-btn rec-btn--ghost"
            onClick={() => {
              if (visibleItems.length === 0) {
                setMessage({ type: 'warn', text: '暂无可导出的产品流水' })
                return
              }
              downloadCsv(visibleItems, month)
              onNotify?.('CSV 已导出', 'success')
            }}
            disabled={loading}
          >
            导出
          </button>
          <button type="button" className="rec-btn rec-btn--primary" onClick={createBill} disabled={loading}>
            生成账单
          </button>
        </div>
        <div className="rd-quicksdk-tool__summary">
          <span>{visibleItems.length} 个产品</span>
          <strong>￥{formatMoney(totalFlow)}</strong>
        </div>
      </div>

      {message && (
        <div className={`rd-quicksdk-tool__message is-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="rd-quicksdk-tool__table-wrap">
        <table className="rd-quicksdk-tool__table">
          <thead>
            <tr>
              <th>产品</th>
              <th>流水</th>
              <th>行数</th>
              <th>渠道</th>
              <th>最高渠道</th>
              <th>最高渠道流水</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="rd-quicksdk-tool__empty">
                  选择月份后读取 QuickSDK 流水
                </td>
              </tr>
            ) : (
              visibleItems.map((item) => (
                <tr key={item.game_name}>
                  <td>{item.game_name}</td>
                  <td>￥{formatMoney(item.total_flow)}</td>
                  <td>{item.row_count || 0}</td>
                  <td>{item.channel_count || 0}</td>
                  <td>{item.top_channel || '-'}</td>
                  <td>￥{formatMoney(item.top_channel_flow)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default QuickSdkRdBillingTool
