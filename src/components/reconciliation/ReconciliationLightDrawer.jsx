import React, { useEffect, useState } from 'react'
import { StatusSelector } from '@/components/StatusManager.jsx'
/**
 * 轻量侧栏：快速查看核心字段、改状态、备注；完整编辑跳转独立页。
 */
function ReconciliationLightDrawer({
  open,
  record,
  onClose,
  onStatusChange,
  onUpdateRecord,
  onNavigateToFullEdit
}) {
  const [memo, setMemo] = useState('')

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
      setMemo(record.memo != null ? String(record.memo) : '')
    } else {
      setMemo('')
    }
  }, [record, open])

  if (!open || !record) return null

  const saveMemo = () => {
    const next = memo.trim()
    if ((record.memo || '') === next) return
    onUpdateRecord?.(record.id, { ...record, memo: next })
  }

  return (
    <>
      <button type="button" className="rec-drawer-backdrop" aria-label="关闭" onClick={onClose} />
      <aside
        className="rec-drawer rec-drawer--light"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rec-light-drawer-title"
        style={{ maxWidth: '400px', width: 'min(400px, 100vw)' }}
      >
        <div className="rec-drawer__head">
          <h2 id="rec-light-drawer-title" className="rec-drawer__title">
            快速查看
          </h2>
          <button type="button" className="rec-drawer__close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <div className="rec-drawer__body rec-drawer__body--light">
          <dl className="rec-light-dl">
            <dt>结算单编号</dt>
            <dd>{record.settlementNumber || '—'}</dd>
            <dt>结算月份</dt>
            <dd>{record.settlementMonth || '—'}</dd>
            <dt>合作方</dt>
            <dd>{record.partner || '—'}</dd>
            <dt>游戏</dt>
            <dd>{record.game || '—'}</dd>
            <dt>游戏流水</dt>
            <dd>¥{parseFloat(record.gameFlow || 0).toFixed(2)}</dd>
            <dt>结算金额</dt>
            <dd className="rec-light-dl__emph">¥{parseFloat(record.settlementAmount || 0).toFixed(2)}</dd>
          </dl>

          <div className="rec-light-field">
            <span className="rec-light-field__label">状态</span>
            <StatusSelector
              currentStatus={record.status || 'pending'}
              onStatusChange={(s) => onStatusChange?.(record.id, s)}
            />
          </div>

          <div className="rec-light-field">
            <label className="rec-light-field__label" htmlFor="rec-light-memo">
              备注
            </label>
            <textarea
              id="rec-light-memo"
              className="admin-input rec-light-memo"
              rows={3}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              onBlur={saveMemo}
              placeholder="本地备注，保存在该条记录上"
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

export default ReconciliationLightDrawer
