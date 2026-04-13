import React, { useMemo, useState } from 'react'
import { VIEWS } from '@/app/routes.js'
import { EXCEPTION_TYPE_LABELS } from '@/lib/exceptions/exceptionTypes.ts'
import { setExceptionUserStatus } from '@/lib/exceptions/exceptionStatusStorage.ts'
import {
  stashInvoiceFocus,
  stashPaymentFocus,
  stashReconciliationFocus,
  stashChannelFocus
} from '@/lib/exceptions/navFocus.ts'

function goToExceptionTarget(item, setActiveView, showToast) {
  switch (item.targetType) {
    case 'invoice':
      stashInvoiceFocus(item.targetId)
      setActiveView(VIEWS.INVOICE_MANAGE)
      showToast?.('已打开发票管理', 'info')
      break
    case 'payment':
      stashPaymentFocus(item.targetId)
      setActiveView(VIEWS.INVOICE_PAYMENT)
      showToast?.('已打开回款登记', 'info')
      break
    case 'reconciliation':
      stashReconciliationFocus(item.targetId)
      setActiveView(VIEWS.RECON_RD)
      showToast?.('已打开研发对账', 'info')
      break
    case 'channel':
      stashChannelFocus(item.targetId)
      setActiveView(VIEWS.RECON_CHANNEL)
      showToast?.('已打开渠道对账', 'info')
      break
    default:
      showToast?.('暂不支持该类型跳转', 'info')
  }
}

function levelClass(level) {
  if (level === 'error') return 'exception-hub20__badge exception-hub20__badge--error'
  if (level === 'warning') return 'exception-hub20__badge exception-hub20__badge--warn'
  return 'exception-hub20__badge exception-hub20__badge--info'
}

function ExceptionCenterPanel({ items, setActiveView, showToast }) {
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return items
    return items.filter((i) => i.status === statusFilter)
  }, [items, statusFilter])

  const grouped = useMemo(() => {
    const m = new Map()
    for (const it of filtered) {
      if (!m.has(it.type)) m.set(it.type, [])
      m.get(it.type).push(it)
    }
    return Array.from(m.entries())
  }, [filtered])

  const counts = useMemo(() => {
    const c = { all: items.length, pending: 0, ignored: 0, resolved: 0 }
    for (const i of items) {
      if (i.status === 'pending') c.pending += 1
      else if (i.status === 'ignored') c.ignored += 1
      else if (i.status === 'resolved') c.resolved += 1
    }
    return c
  }, [items])

  const setStatus = async (id, st) => {
    const { usedFallback } = await setExceptionUserStatus(id, st)
    const suffix = usedFallback ? '（仅本机，服务器暂不可用）' : '（已同步）'
    if (st === 'ignored') showToast?.(`已标记为忽略${suffix}`, 'success')
    else if (st === 'resolved') showToast?.(`已标记为已解决${suffix}`, 'success')
    else showToast?.(`已恢复为待处理${suffix}`, 'success')
  }

  if (items.length === 0) {
    return (
      <div className="exception-hub20 exception-hub20--empty">
        <div className="exception-hub20__empty-title">未发现业务异常</div>
        <p className="exception-hub20__empty-desc">
          当前发票、回款关联、渠道与研发对账数据未命中规则；仍可在下方查看完整字段校验。
        </p>
      </div>
    )
  }

  return (
    <div className="exception-hub20">
      <div className="exception-hub20__toolbar">
        <span className="exception-hub20__toolbar-label">处理状态</span>
        <div className="exception-hub20__filters">
          {[
            ['all', '全部', counts.all],
            ['pending', '待处理', counts.pending],
            ['ignored', '已忽略', counts.ignored],
            ['resolved', '已解决', counts.resolved]
          ].map(([key, label, n]) => (
            <button
              key={key}
              type="button"
              className={`exception-hub20__filter-btn ${statusFilter === key ? 'is-active' : ''}`}
              onClick={() => setStatusFilter(key)}
            >
              {label} ({n})
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="exception-hub20__none">当前筛选下无异常项</div>
      ) : (
        grouped.map(([type, list]) => (
          <section key={type} className="exception-hub20__group">
            <h4 className="exception-hub20__group-title">
              {EXCEPTION_TYPE_LABELS[type] || type}
              <span className="exception-hub20__group-count">{list.length}</span>
            </h4>
            <ul className="exception-hub20__list">
              {list.map((item) => (
                <li key={item.id} className="exception-hub20__row">
                  <div className="exception-hub20__row-main">
                    <span className={levelClass(item.level)}>{item.level === 'error' ? '错误' : item.level === 'warning' ? '警告' : '提示'}</span>
                    <div className="exception-hub20__row-text">
                      <div className="exception-hub20__row-title">{item.title}</div>
                      <div className="exception-hub20__row-desc">{item.description}</div>
                      <div className="exception-hub20__row-meta">
                        ID: {item.targetId} ·{' '}
                        {item.status === 'pending' ? '待处理' : item.status === 'ignored' ? '已忽略' : '已解决'}
                      </div>
                    </div>
                  </div>
                  <div className="exception-hub20__row-actions">
                    <button
                      type="button"
                      className="rec-btn rec-btn--primary rec-btn--sm"
                      onClick={() => goToExceptionTarget(item, setActiveView, showToast)}
                    >
                      去处理
                    </button>
                    {item.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          className="rec-btn rec-btn--ghost rec-btn--sm"
                          onClick={() => setStatus(item.id, 'ignored')}
                        >
                          忽略
                        </button>
                        <button
                          type="button"
                          className="rec-btn rec-btn--secondary rec-btn--sm"
                          onClick={() => setStatus(item.id, 'resolved')}
                        >
                          已解决
                        </button>
                      </>
                    )}
                    {item.status === 'ignored' && (
                      <button
                        type="button"
                        className="rec-btn rec-btn--ghost rec-btn--sm"
                        onClick={() => setStatus(item.id, 'pending')}
                      >
                        恢复待处理
                      </button>
                    )}
                    {item.status === 'resolved' && (
                      <button
                        type="button"
                        className="rec-btn rec-btn--ghost rec-btn--sm"
                        onClick={() => setStatus(item.id, 'pending')}
                      >
                        恢复待处理
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}

export default ExceptionCenterPanel
