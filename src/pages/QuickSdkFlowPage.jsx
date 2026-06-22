import React, { useEffect, useMemo, useState } from 'react'
import PageContainer from '@/components/layout/PageContainer.jsx'
import {
  getQuickSdkSummary,
  listQuickSdkBatches,
  listQuickSdkRdLines
} from '@/lib/api/quicksdk.ts'
import './QuickSdkFlowPage.css'

function currentMonthValue() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function formatMoney(value) {
  const n = Number(value || 0)
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDateTime(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString('zh-CN', { hour12: false })
}

function QuickSdkFlowPage() {
  const [month, setMonth] = useState(currentMonthValue())
  const [query, setQuery] = useState('')
  const [summary, setSummary] = useState(null)
  const [batches, setBatches] = useState([])
  const [lines, setLines] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const filteredLines = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return lines
    return lines.filter((item) => String(item.game_name || '').toLowerCase().includes(keyword))
  }, [lines, query])

  const loadData = async () => {
    setLoading(true)
    setMessage('')
    try {
      const [summaryRes, batchesRes, linesRes] = await Promise.all([
        getQuickSdkSummary({ settlement_month: month }),
        listQuickSdkBatches({ settlement_month: month, limit: 20 }),
        listQuickSdkRdLines({ settlement_month: month, limit: 500 })
      ])
      setSummary(summaryRes)
      setBatches(batchesRes.items || [])
      setLines(linesRes.items || [])
      setMessage(`${month} 已读取 ${linesRes.items?.length || 0} 个产品`)
    } catch (err) {
      setSummary(null)
      setBatches([])
      setLines([])
      setMessage(err instanceof Error ? err.message : 'QuickSDK 数据读取失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <PageContainer hideHeader className="page-container--quicksdk">
      <div className="quicksdk-page">
        <section className="quicksdk-hero">
          <div>
            <span>数据中心</span>
            <h2>QuickSDK 流水库</h2>
            <p>查看已导入的月份、批次、产品流水和渠道汇总。</p>
          </div>
          <div className="quicksdk-toolbar">
            <input
              type="month"
              className="admin-input"
              value={month}
              onChange={(e) => setMonth(e.target.value || currentMonthValue())}
            />
            <input
              type="text"
              className="admin-input quicksdk-toolbar__search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索产品"
            />
            <button type="button" className="rec-btn rec-btn--primary" onClick={loadData} disabled={loading}>
              {loading ? '读取中' : '刷新'}
            </button>
          </div>
        </section>

        <section className="quicksdk-stats" aria-label="QuickSDK 汇总">
          <div>
            <span>导入批次</span>
            <strong>{summary?.batch_count ?? 0}</strong>
          </div>
          <div>
            <span>流水行数</span>
            <strong>{summary?.row_count ?? 0}</strong>
          </div>
          <div>
            <span>产品 / 渠道</span>
            <strong>{summary ? `${summary.game_count} / ${summary.channel_count}` : '0 / 0'}</strong>
          </div>
          <div>
            <span>流水合计</span>
            <strong>￥{formatMoney(summary?.total_flow)}</strong>
          </div>
        </section>

        {message && <div className="quicksdk-message">{message}</div>}

        <section className="quicksdk-section">
          <div className="quicksdk-section__head">
            <h3>导入批次</h3>
            <span>{batches.length} 条</span>
          </div>
          <div className="quicksdk-table-wrap">
            <table className="quicksdk-table">
              <thead>
                <tr>
                  <th>文件</th>
                  <th>月份</th>
                  <th>行数</th>
                  <th>产品</th>
                  <th>渠道</th>
                  <th>流水</th>
                  <th>导入时间</th>
                </tr>
              </thead>
              <tbody>
                {batches.length === 0 ? (
                  <tr><td colSpan={7} className="quicksdk-empty">当前月份暂无导入批次</td></tr>
                ) : batches.map((batch) => (
                  <tr key={batch.id}>
                    <td>{batch.source_file}</td>
                    <td>{batch.settlement_month}</td>
                    <td>{batch.row_count}</td>
                    <td>{batch.game_count}</td>
                    <td>{batch.channel_count}</td>
                    <td>￥{formatMoney(batch.total_flow)}</td>
                    <td>{formatDateTime(batch.imported_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="quicksdk-section">
          <div className="quicksdk-section__head">
            <h3>产品流水汇总</h3>
            <span>{filteredLines.length} 个产品</span>
          </div>
          <div className="quicksdk-table-wrap">
            <table className="quicksdk-table">
              <thead>
                <tr>
                  <th>产品</th>
                  <th>流水</th>
                  <th>行数</th>
                  <th>渠道数</th>
                  <th>最高渠道</th>
                  <th>最高渠道流水</th>
                </tr>
              </thead>
              <tbody>
                {filteredLines.length === 0 ? (
                  <tr><td colSpan={6} className="quicksdk-empty">当前条件暂无产品流水</td></tr>
                ) : filteredLines.map((item) => (
                  <tr key={`${item.settlement_month}-${item.game_name}`}>
                    <td>{item.game_name}</td>
                    <td>￥{formatMoney(item.total_flow)}</td>
                    <td>{item.row_count}</td>
                    <td>{item.channel_count}</td>
                    <td>{item.top_channel || '-'}</td>
                    <td>￥{formatMoney(item.top_channel_flow)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageContainer>
  )
}

export default QuickSdkFlowPage
