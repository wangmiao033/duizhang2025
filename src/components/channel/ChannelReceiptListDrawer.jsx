import React, { useEffect, useState } from 'react'
import { listChannelReceipts } from '@/lib/api/channel.ts'
import { API_BASE_URL } from '@/lib/api/client.ts'

function formatYuan(n) {
  const x = Number(n) || 0
  return `¥${x.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function attachmentHref(url) {
  if (!url || !String(url).trim()) return ''
  const u = String(url).trim()
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  return `${API_BASE_URL}${u.startsWith('/') ? u : `/${u}`}`
}

/**
 * 单笔渠道对账的收款明细列表
 */
function ChannelReceiptListDrawer({
  open,
  recordId,
  channelName,
  channelApiEnabled,
  showToast,
  onClose,
  onDeleteReceipt
}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open || !recordId) {
      setItems([])
      return
    }
    if (!channelApiEnabled) {
      setItems([])
      return
    }
    let cancelled = false
    setLoading(true)
    listChannelReceipts(recordId)
      .then((res) => {
        if (!cancelled) setItems(res.items || [])
      })
      .catch((e) => {
        console.error(e)
        if (!cancelled) {
          setItems([])
          showToast?.('加载收款记录失败', 'error')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, recordId, channelApiEnabled, showToast])

  if (!open) return null

  const handleDelete = async (receiptId) => {
    if (!window.confirm('确定删除该条收款记录？将同步更新已收金额与状态。')) return
    setDeletingId(receiptId)
    try {
      const ok = await onDeleteReceipt?.(recordId, receiptId)
      if (ok) {
        setItems((prev) => prev.filter((x) => x.id !== receiptId))
        showToast?.('已删除收款记录', 'success')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <button type="button" className="rec-drawer-backdrop" aria-label="关闭" onClick={onClose} />
      <aside
        className="rec-drawer rec-drawer--light channel-receipt-list-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="channel-receipt-list-title"
      >
        <div className="rec-drawer__head">
          <h2 id="channel-receipt-list-title" className="rec-drawer__title">
            收款记录
            {channelName ? <span className="channel-receipt-list-drawer__sub">{channelName}</span> : null}
          </h2>
          <button type="button" className="rec-drawer__close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <div className="rec-drawer__body rec-drawer__body--light">
          {!channelApiEnabled ? (
            <p className="channel-receipt-offline muted">离线模式下无法查看服务器收款明细。</p>
          ) : loading ? (
            <p className="muted">加载中…</p>
          ) : items.length === 0 ? (
            <p className="muted">暂无收款记录</p>
          ) : (
            <div className="channel-receipt-list-table-wrap">
              <table className="channel-receipt-list-table">
                <thead>
                  <tr>
                    <th>收款日期</th>
                    <th className="num">金额</th>
                    <th>银行账户</th>
                    <th>备注</th>
                    <th>附件</th>
                    <th className="actions-col">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id}>
                      <td>{row.receipt_date || '—'}</td>
                      <td className="num">{formatYuan(row.amount)}</td>
                      <td className="cell-wrap">{row.bank_account || '—'}</td>
                      <td className="cell-wrap">{row.remark || '—'}</td>
                      <td>
                        {row.attachment_url ? (
                          <a
                            href={attachmentHref(row.attachment_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="channel-receipt-list-link"
                          >
                            查看
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="actions-col">
                        <button
                          type="button"
                          className="delete-btn channel-receipt-list-del"
                          disabled={deletingId === row.id}
                          onClick={() => void handleDelete(row.id)}
                        >
                          {deletingId === row.id ? '…' : '删除'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="rec-drawer__footer rec-drawer__footer--light">
          <button type="button" className="rec-btn rec-btn--ghost" onClick={onClose}>
            关闭
          </button>
        </div>
      </aside>
    </>
  )
}

export default ChannelReceiptListDrawer
