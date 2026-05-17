import React, { useMemo } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import PageContainer from '@/components/layout/PageContainer.jsx'
import { STATUS_OPTIONS } from '@/components/StatusManager.jsx'
import { calculateSettlementAmount } from '@/domain/settlement/calculateSettlementAmount.js'
import { computeStatusAggregates } from '@/domain/reconciliation/reconciliationStats.js'
import { VIEWS } from '@/app/routes.js'
import { useExceptionItems } from '@/hooks/useExceptionItems.js'
import { getValidationStatistics, validateAllRecords } from '@/utils/dataValidation.js'

const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

function toNumber(value) {
  const n = Number.parseFloat(String(value ?? 0))
  return Number.isFinite(n) ? n : 0
}

function formatMoney(value) {
  return currencyFormatter.format(toNumber(value))
}

function formatTime(value) {
  if (!value) return ''
  try {
    return value.toLocaleTimeString('zh-CN', { hour12: false })
  } catch {
    return ''
  }
}

function getRecordName(record) {
  const names = []
  if (record.partner) names.push(record.partner)
  if (record.game) names.push(record.game)
  if (names.length > 0) return names.join(' / ')
  return record.settlementNumber || '未命名对账记录'
}

function getStatusMeta(status) {
  return STATUS_OPTIONS.find((item) => item.value === status) || STATUS_OPTIONS[0]
}

function DashboardPage() {
  const {
    recon,
    showToast,
    setActiveView,
    openReconciliationEdit,
    navigateBankPaymentForReconciliation
  } = useAppState()
  const { pendingCount: pendingExceptionCount } = useExceptionItems()
  const { records, channelRecords, statistics, lastSaveTime, handleExportAll, setRecords } = recon

  const statusAggregates = useMemo(() => computeStatusAggregates(records, STATUS_OPTIONS), [records])

  const validationStats = useMemo(() => {
    const issues = validateAllRecords(records, calculateSettlementAmount)
    return getValidationStatistics(issues)
  }, [records])

  const dashboardStats = useMemo(() => {
    const pending = statusAggregates.find((row) => row.value === 'pending') || { count: 0, amount: 0 }
    const confirmed = statusAggregates.find((row) => row.value === 'confirmed') || {
      count: 0,
      amount: 0
    }
    const settled = statusAggregates.find((row) => row.value === 'settled') || { count: 0, amount: 0 }
    const invoiced = statusAggregates.find((row) => row.value === 'invoiced') || { count: 0, amount: 0 }
    const verified = statusAggregates.find((row) => row.value === 'verified') || { count: 0, amount: 0 }
    const waitingPayment = records.filter((record) => {
      const status = record.status || 'pending'
      const unpaid = toNumber(record.unpaidAmount)
      const paymentStatus = String(record.paymentStatus || '')
      return (
        ['confirmed', 'settled'].includes(status) ||
        unpaid > 0 ||
        paymentStatus.includes('未') ||
        paymentStatus.includes('部分')
      )
    })
    const waitingInvoice = records.filter((record) => !['invoiced', 'verified'].includes(record.status || 'pending'))
    const channelPending = (channelRecords || []).filter((record) => (record.status || 'pending') === 'pending')

    return {
      pending,
      confirmed,
      settled,
      invoiced,
      verified,
      waitingPaymentCount: waitingPayment.length,
      waitingPaymentAmount: waitingPayment.reduce((sum, record) => {
        const unpaid = toNumber(record.unpaidAmount)
        return sum + (unpaid > 0 ? unpaid : toNumber(record.settlementAmount))
      }, 0),
      waitingInvoiceCount: waitingInvoice.length,
      waitingInvoiceAmount: waitingInvoice.reduce((sum, record) => sum + toNumber(record.settlementAmount), 0),
      channelPendingCount: channelPending.length,
      channelRecordCount: (channelRecords || []).length
    }
  }, [channelRecords, records, statusAggregates])

  const recentRecords = useMemo(() => {
    return [...records].slice(-6).reverse()
  }, [records])

  const handleImportData = () => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.json,.xlsx,.xls'
    fileInput.onchange = (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      if (!file.name.endsWith('.json')) {
        showToast('Excel 请到“银行流水导入”或对应模块处理，这里只接收 JSON 备份。', 'info')
        return
      }
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result)
          if (Array.isArray(data.records)) {
            setRecords(data.records)
            showToast('JSON 备份导入成功', 'success')
          } else {
            showToast('导入失败：没有找到 records 数据', 'error')
          }
        } catch {
          showToast('导入失败：文件格式错误', 'error')
        }
      }
      reader.readAsText(file)
    }
    fileInput.click()
  }

  const primaryMetrics = [
    {
      label: '研发对账记录',
      value: statistics.recordCount,
      helper: `结算金额 ${formatMoney(statistics.totalSettlementAmount)}`,
      tone: 'blue',
      onClick: () => setActiveView(VIEWS.RECON_MASTER)
    },
    {
      label: '待确认',
      value: dashboardStats.pending.count,
      helper: formatMoney(dashboardStats.pending.amount),
      tone: 'amber',
      onClick: () => setActiveView(VIEWS.RECON_RD)
    },
    {
      label: '待付款/结算',
      value: dashboardStats.waitingPaymentCount,
      helper: formatMoney(dashboardStats.waitingPaymentAmount),
      tone: 'green',
      onClick: () => setActiveView(VIEWS.BANK_PAYMENT_REGISTER)
    },
    {
      label: '异常待处理',
      value: pendingExceptionCount + validationStats.errors,
      helper: `${pendingExceptionCount} 个业务异常，${validationStats.errors} 个校验错误`,
      tone: pendingExceptionCount + validationStats.errors > 0 ? 'red' : 'green',
      onClick: () => setActiveView(VIEWS.RECON_EXCEPTIONS)
    }
  ]

  const todoItems = [
    {
      label: '确认研发对账',
      count: dashboardStats.pending.count,
      amount: dashboardStats.pending.amount,
      description: '新录入或未确认记录，先完成核对。',
      actionText: '去研发对账',
      view: VIEWS.RECON_RD
    },
    {
      label: '处理业务异常',
      count: pendingExceptionCount + validationStats.total,
      amount: null,
      description: '检查缺字段、重复、金额异常和发票回款异常。',
      actionText: '去异常中心',
      view: VIEWS.RECON_EXCEPTIONS
    },
    {
      label: '付款确认',
      count: dashboardStats.waitingPaymentCount,
      amount: dashboardStats.waitingPaymentAmount,
      description: '确认研发侧应付与银行付款登记。',
      actionText: '登记付款',
      view: VIEWS.BANK_PAYMENT_REGISTER
    },
    {
      label: '开票/回款跟进',
      count: dashboardStats.waitingInvoiceCount,
      amount: dashboardStats.waitingInvoiceAmount,
      description: '未开票、未核销的记录需要继续流转。',
      actionText: '去发票台账',
      view: VIEWS.INVOICE_OUTPUT
    }
  ]

  const workflow = [
    { label: '录入', helper: '新增研发/渠道记录', count: records.length + dashboardStats.channelRecordCount, view: VIEWS.RECON_CREATE },
    { label: '确认', helper: '待确认对账', count: dashboardStats.pending.count, view: VIEWS.RECON_RD },
    { label: '结算', helper: '月度结算单', count: dashboardStats.confirmed.count + dashboardStats.settled.count, view: VIEWS.SETTLE_MONTHLY },
    { label: '开票', helper: '销项/进项发票', count: dashboardStats.invoiced.count, view: VIEWS.INVOICE_OUTPUT },
    { label: '核销', helper: '已完成闭环', count: dashboardStats.verified.count, view: VIEWS.INVOICE_VERIFY }
  ]

  const quickEntries = [
    { label: '新增研发对账', helper: '录入研发侧结算记录', view: VIEWS.RECON_CREATE },
    { label: '新增渠道对账', helper: '录入渠道侧回款与分成', view: VIEWS.CHANNEL_RECON_CREATE },
    { label: '对账总表', helper: '统一查看全部研发记录', view: VIEWS.RECON_MASTER },
    { label: '月度结算单', helper: '生成和查看结算单', view: VIEWS.SETTLE_MONTHLY },
    { label: '银行流水导入', helper: '导入银行流水并匹配业务', view: VIEWS.BANK_STATEMENT_IMPORT },
    { label: '回款登记', helper: '登记渠道/项目回款', view: VIEWS.BANK_COLLECTION_REGISTER },
    { label: '合同管理', helper: '维护合同与分成比例', view: VIEWS.CONTRACT_MANAGEMENT },
    { label: '账号管理', helper: '维护内部登录账号', view: VIEWS.AUTH_USERS }
  ]

  return (
    <PageContainer hideHeader>
      <div className="dashboard-workbench">
        <section className="dashboard-hero-panel" aria-labelledby="dashboard-heading">
          <div className="dashboard-title-block dashboard-title-block--compact">
            <p className="dashboard-eyebrow">对账业务工作台</p>
            <h1 id="dashboard-heading" className="dashboard-title">今天先处理这些事</h1>
            <p className="dashboard-subtitle">
              按“录入 → 确认 → 结算 → 开票 → 核销”组织入口，工作台只保留真正要处理的内容。
            </p>
          </div>
          <div className="dashboard-hero-actions" aria-label="常用操作">
            <button type="button" className="dashboard-primary-action" onClick={() => setActiveView(VIEWS.RECON_CREATE)}>
              新增研发对账
            </button>
            <button type="button" className="dashboard-secondary-action" onClick={() => setActiveView(VIEWS.RECON_MASTER)}>
              查看总表
            </button>
          </div>
        </section>

        {lastSaveTime && (
          <div className="save-indicator dashboard-save-indicator">
            <span className="save-time">已自动保存 {formatTime(lastSaveTime)}</span>
            <span className="shortcut-hint">Ctrl+F 搜索 · Ctrl+P 打印 · Ctrl+Enter 保存编辑</span>
          </div>
        )}

        <section className="dashboard-metric-grid" aria-label="业务概览">
          {primaryMetrics.map((metric) => (
            <button
              type="button"
              key={metric.label}
              className={`dashboard-metric-card dashboard-metric-card--${metric.tone}`}
              onClick={metric.onClick}
            >
              <span className="dashboard-metric-label">{metric.label}</span>
              <strong className="dashboard-metric-value">{metric.value}</strong>
              <span className="dashboard-metric-helper">{metric.helper}</span>
            </button>
          ))}
        </section>

        <div className="dashboard-grid">
          <section className="dashboard-panel dashboard-panel--todo" aria-labelledby="dashboard-todo-title">
            <div className="dashboard-section-header">
              <div>
                <h2 id="dashboard-todo-title">待处理</h2>
                <p>按优先级进入对应模块，不再把所有功能堆在首页。</p>
              </div>
            </div>
            <div className="dashboard-todo-list">
              {todoItems.map((item) => (
                <button
                  type="button"
                  key={item.label}
                  className="dashboard-todo-item"
                  onClick={() => setActiveView(item.view)}
                >
                  <span className="dashboard-todo-main">
                    <strong>{item.label}</strong>
                    <span>{item.description}</span>
                  </span>
                  <span className="dashboard-todo-meta">
                    <strong>{item.count}</strong>
                    {item.amount != null && <span>{formatMoney(item.amount)}</span>}
                  </span>
                  <span className="dashboard-todo-link">{item.actionText}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="dashboard-panel dashboard-panel--workflow" aria-labelledby="dashboard-workflow-title">
            <div className="dashboard-section-header">
              <div>
                <h2 id="dashboard-workflow-title">业务流程</h2>
                <p>从录入到核销的完整闭环。</p>
              </div>
            </div>
            <div className="dashboard-workflow">
              {workflow.map((step, index) => (
                <button
                  type="button"
                  key={step.label}
                  className="dashboard-workflow-step"
                  onClick={() => setActiveView(step.view)}
                >
                  <span className="dashboard-workflow-index">{index + 1}</span>
                  <span className="dashboard-workflow-copy">
                    <strong>{step.label}</strong>
                    <span>{step.helper}</span>
                  </span>
                  <span className="dashboard-workflow-count">{step.count}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <section className="dashboard-panel" aria-labelledby="dashboard-entries-title">
          <div className="dashboard-section-header">
            <div>
              <h2 id="dashboard-entries-title">常用入口</h2>
              <p>保留日常会点的入口；导入导出放到右侧工具，不抢主流程。</p>
            </div>
            <div className="dashboard-utility-actions">
              <button type="button" onClick={handleImportData}>导入 JSON</button>
              <button type="button" onClick={handleExportAll}>导出全部</button>
            </div>
          </div>
          <div className="dashboard-entry-grid">
            {quickEntries.map((entry) => (
              <button
                type="button"
                key={entry.label}
                className="dashboard-entry-card"
                onClick={() => setActiveView(entry.view)}
              >
                <strong>{entry.label}</strong>
                <span>{entry.helper}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="dashboard-panel" aria-labelledby="dashboard-recent-title">
          <div className="dashboard-section-header">
            <div>
              <h2 id="dashboard-recent-title">最近研发对账</h2>
              <p>快速回到刚处理过的记录。</p>
            </div>
            <button type="button" className="dashboard-text-action" onClick={() => setActiveView(VIEWS.RECON_RD)}>
              查看全部
            </button>
          </div>
          {recentRecords.length > 0 ? (
            <div className="dashboard-recent-table" role="table" aria-label="最近研发对账记录">
              <div className="dashboard-recent-row dashboard-recent-row--head" role="row">
                <span role="columnheader">记录</span>
                <span role="columnheader">月份</span>
                <span role="columnheader">状态</span>
                <span role="columnheader">结算金额</span>
                <span role="columnheader">付款</span>
              </div>
              {recentRecords.map((record) => {
                const status = getStatusMeta(record.status || 'pending')
                return (
                  <button
                    type="button"
                    key={record.id || `${record.settlementNumber}-${record.game}`}
                    className="dashboard-recent-row"
                    role="row"
                    onClick={() => openReconciliationEdit?.(String(record.id || ''))}
                  >
                    <span role="cell" className="dashboard-recent-title">{getRecordName(record)}</span>
                    <span role="cell">{record.settlementMonth || '-'}</span>
                    <span role="cell">
                      <span className="dashboard-status-pill" style={{ '--status-color': status.color }}>
                        {status.label}
                      </span>
                    </span>
                    <span role="cell">{formatMoney(record.settlementAmount)}</span>
                    <span role="cell" className="dashboard-payment-cell">
                      {record.paymentStatus || '未登记'}
                      {String(record.id || '').trim() !== '' && (
                        <span
                          className="dashboard-payment-link"
                          onClick={(event) => {
                            event.stopPropagation()
                            navigateBankPaymentForReconciliation?.(String(record.id))
                          }}
                        >
                          付款
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="dashboard-empty-state">
              <strong>还没有研发对账记录</strong>
              <span>先新增一条研发对账，工作台会自动出现待办和最近记录。</span>
              <button type="button" onClick={() => setActiveView(VIEWS.RECON_CREATE)}>新增研发对账</button>
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  )
}

export default DashboardPage
