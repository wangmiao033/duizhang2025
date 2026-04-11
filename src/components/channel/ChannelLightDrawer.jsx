import React, { useEffect, useState } from 'react'
import { StatusSelector } from '@/components/StatusManager.jsx'

/**
 * 渠道对账轻量侧栏：摘要、状态、备注；完整编辑跳转独立页。
 */
function ChannelLightDrawer({
  open,
  record,
  onClose,
  onUpdateRecord,
  onNavigateToFullEdit
}) {
  const [remark, setRemark] = useState('')

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (record) {
      setRemark(record.remark != null ? String(record.remark) : '')
    } else {
      setRemark('')
    }
  }, [record, open])

  if (!open || !record) return null

  const saveRemark = () => {
    const next = remark.trim()
    if ((record.remark || '') === next) return
    onUpdateRecord?.(record.id, { ...record, remark: next })
  }

  const flow = parseFloat(record.flow) || 0
  const settlement = parseFloat(record.settlementAmount) || 0

  return (
    <>
      <button type="button" className="rec-drawer-backdrop" aria-label="关闭" onClick={onClose} />
      <aside
        className="rec-drawer rec-drawer--light"
        role="dialog"
        aria-modal="true"
        aria-labelledby="channel-light-drawer-title"
      >
        <div className="rec-drawer__head">
          <h2 id="channel-light-drawer-title" className="rec-drawer__title">
            快速查看
          </h2>
          <button type="button" className="rec-drawer__close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <div className="rec-drawer__body rec-drawer__body--light">
          <dl className="rec-light-dl">
            <dt>渠道</dt>
            <dd>{record.channelName || '—'}</dd>
            <dt>游戏</dt>
            <dd>{record.gameName || '—'}</dd>
            <dt>结算区间</dt>
            <dd>
              {record.startDate || '—'} ~ {record.endDate || '—'}
            </dd>
            <dt>后台流水</dt>
            <dd>¥{flow.toFixed(2)}</dd>
            <dt>结算金额</dt>
            <dd className="rec-light-dl__emph">¥{settlement.toFixed(2)}</dd>
          </dl>

          <div className="rec-light-field">
            <span className="rec-light-field__label">状态</span>
            <StatusSelector
              currentStatus={record.status || 'pending'}
              onStatusChange={(s) => onUpdateRecord?.(record.id, { ...record, status: s })}
            />
          </div>

          <div className="rec-light-field">
            <label className="rec-light-field__label" htmlFor="channel-light-remark">
              备注
            </label>
            <textarea
              id="channel-light-remark"
              className="admin-input rec-light-memo"
              rows={3}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              onBlur={saveRemark}
              placeholder="备注保存在该条渠道记录上"
            />
          </div>
        </div>
        <div className="rec-drawer__footer rec-drawer__footer--light">
          <button type="button" className="rec-btn rec-btn--ghost" onClick={onClose}>
            关闭
          </button>
          <button
            type="button"
            className="rec-btn rec-btn--primary"
            onClick={() => {
              onNavigateToFullEdit?.(record.id)
              onClose()
            }}
          >
            完整编辑
          </button>
        </div>
      </aside>
    </>
  )
}

export default ChannelLightDrawer
