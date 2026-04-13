import React, { useMemo, useState } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import InvoicePaymentLinkTools from '@/components/invoice/InvoicePaymentLinkTools.jsx'
import { useInvoicePaymentLinks } from '@/hooks/useInvoicePaymentLinks.js'
import AdminWorkspace from '@/components/admin/AdminWorkspace.jsx'
import AdminFilterBar from '@/components/admin/AdminFilterBar.jsx'
import AdminActionBar from '@/components/admin/AdminActionBar.jsx'
import AdminStatsRow from '@/components/admin/AdminStatsRow.jsx'
import AdminTableCard from '@/components/admin/AdminTableCard.jsx'
import AdminListEmptyState from '@/components/admin/AdminListEmptyState.jsx'
import PaymentLightDrawer from '@/components/payment/PaymentLightDrawer.jsx'
import '@/components/reconciliation/reconciliation-admin.css'
import '@/components/DeliveryCenter.css'
import { VIEWS } from '@/app/routes.js'
import { DELIVERY_STATUSES } from '@/domain/payment/deliveryForm.js'
import { getInvoiceRecordId } from '@/lib/api/invoice.ts'
import { getPaymentRecordId } from '@/lib/api/payment.ts'

function getStatusClass(status) {
  const statusMap = {
    待寄出: 'pending',
    已寄出: 'sent',
    运输中: 'transit',
    已送达: 'delivered',
    已签收: 'received',
    异常: 'error'
  }
  return statusMap[status] || 'pending'
}

function PaymentRegisterWorkspace() {
  const { settings, setActiveView, openPaymentEdit, invoice, showToast } = useAppState()
  const { deliveries, patchDeliveryRecord, deleteDeliveryById } = settings

  const [filterStatus, setFilterStatus] = useState('全部')
  const [searchTerm, setSearchTerm] = useState('')
  const [drawerRecord, setDrawerRecord] = useState(null)
  const { refresh: refreshIpLinks, byPaymentId } = useInvoicePaymentLinks()
  const [focusPaymentForLink, setFocusPaymentForLink] = useState('')

  const invoiceLabelById = useMemo(() => {
    const m = new Map()
    for (const inv of invoice?.invoiceRecords || []) {
      const iid = getInvoiceRecordId(inv)
      const label = [inv.title, inv.taxNo].filter(Boolean).join(' · ') || iid
      m.set(iid, label.slice(0, 40))
    }
    return m
  }, [invoice?.invoiceRecords])

  const drawerLinkedInvoices = useMemo(() => {
    if (!drawerRecord) return []
    const pid = getPaymentRecordId(drawerRecord)
    return (byPaymentId.get(pid) || []).map((L) => ({
      linkId: L.id,
      invoiceId: L.invoice_id,
      label: invoiceLabelById.get(L.invoice_id) || L.invoice_id
    }))
  }, [drawerRecord, byPaymentId, invoiceLabelById])

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      const matchStatus = filterStatus === '全部' || d.status === filterStatus
      const term = searchTerm.toLowerCase()
      const matchSearch =
        !searchTerm ||
        d.trackingNumber?.toLowerCase().includes(term) ||
        d.recipient?.toLowerCase().includes(term) ||
        d.partnerName?.toLowerCase().includes(term) ||
        d.address?.toLowerCase().includes(term)
      return matchStatus && matchSearch
    })
  }, [deliveries, filterStatus, searchTerm])

  const handleDelete = (id) => {
    if (window.confirm('确定要删除这条快递记录吗？')) {
      void deleteDeliveryById(id)
    }
  }

  return (
    <AdminWorkspace className="payment-rd-workspace">
      <AdminFilterBar>
        <div className="channel-rd__filters">
          <label className="channel-rd__field">
            <span className="channel-rd__label">状态</span>
            <select
              className="admin-input channel-rd__select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="全部">全部</option>
              {DELIVERY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="channel-rd__field channel-rd__field--grow">
            <span className="channel-rd__label">搜索</span>
            <input
              type="search"
              className="admin-input channel-rd__search"
              placeholder="单号、收件人、客户、地址"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>
        </div>
      </AdminFilterBar>

      <AdminActionBar>
        <div className="rec-toolbar">
          <div className="rec-toolbar__primary">
            <button
              type="button"
              className="rec-btn rec-btn--primary"
              onClick={() => setActiveView(VIEWS.PAYMENT_CREATE)}
            >
              新增登记
            </button>
            <InvoicePaymentLinkTools
              invoiceRecords={invoice?.invoiceRecords || []}
              deliveries={deliveries}
              onLinksChanged={() => void refreshIpLinks()}
              showToast={showToast}
              focusPaymentId={focusPaymentForLink}
              onConsumedFocusPayment={() => setFocusPaymentForLink('')}
            />
          </div>
        </div>
      </AdminActionBar>

      <AdminStatsRow>
        <div className="rec-stats-cards rec-stats-cards--compact" aria-label="回款登记概览">
          {[
            { label: '总记录', value: String(deliveries.length) },
            { label: '当前筛选', value: String(filteredDeliveries.length), emphasize: true },
            {
              label: '待寄出',
              value: String(deliveries.filter((d) => d.status === '待寄出').length)
            }
          ].map((c) => (
            <div
              key={c.label}
              className={`rec-stat-card ${c.emphasize ? 'rec-stat-card--emphasis' : ''}`}
            >
              <div className="rec-stat-card__label">{c.label}</div>
              <div className="rec-stat-card__value">{c.value}</div>
            </div>
          ))}
        </div>
      </AdminStatsRow>

      <AdminTableCard className="payment-rd__table-card">
        {filteredDeliveries.length === 0 ? (
          <AdminListEmptyState
            title={deliveries.length === 0 ? '暂无回款登记' : '没有匹配的记录'}
            description={
              deliveries.length === 0
                ? '登记快递/寄送台账，便于与发票、对账流程衔接。'
                : '尝试调整状态筛选或清空搜索关键词。'
            }
            primaryAction={
              deliveries.length === 0
                ? { label: '新增登记', onClick: () => setActiveView(VIEWS.PAYMENT_CREATE) }
                : undefined
            }
            secondaryAction={
              deliveries.length > 0
                ? { label: '清空筛选条件', onClick: () => { setFilterStatus('全部'); setSearchTerm('') } }
                : undefined
            }
          />
        ) : (
          <div className="delivery-table-wrapper">
            <table className="delivery-table">
              <thead>
                <tr>
                  <th>快递单号</th>
                  <th>快递公司</th>
                  <th>收件人</th>
                  <th>收件地址</th>
                  <th>关联客户</th>
                  <th>发票关联</th>
                  <th>状态</th>
                  <th>寄出日期</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeliveries.map((delivery) => {
                  const rid = getPaymentRecordId(delivery) || delivery.id
                  const invN = (byPaymentId.get(rid) || []).length
                  return (
                  <tr key={rid}>
                    <td>{delivery.trackingNumber || '-'}</td>
                    <td>{delivery.courierCompany || '-'}</td>
                    <td>
                      <div>{delivery.recipient}</div>
                      {delivery.recipientPhone ? (
                        <div className="phone-text">{delivery.recipientPhone}</div>
                      ) : null}
                    </td>
                    <td className="address-cell">{delivery.address || '-'}</td>
                    <td>{delivery.partnerName || '-'}</td>
                    <td>{invN > 0 ? `已关联 ${invN} 张` : '未关联'}</td>
                    <td>
                      <span className={`status-badge status-${getStatusClass(delivery.status)}`}>
                        {delivery.status}
                      </span>
                    </td>
                    <td>{delivery.sendDate || '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <button type="button" className="edit-btn" onClick={() => setDrawerRecord(delivery)}>
                          查看
                        </button>
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => openPaymentEdit(rid)}
                        >
                          编辑
                        </button>
                        <button type="button" className="delete-btn" onClick={() => handleDelete(rid)}>
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </AdminTableCard>

      <PaymentLightDrawer
        open={Boolean(drawerRecord)}
        record={drawerRecord}
        onClose={() => setDrawerRecord(null)}
        onUpdateRecord={(next) => void patchDeliveryRecord(next)}
        onNavigateToFullEdit={(id) => openPaymentEdit(id)}
        linkedInvoiceRows={drawerLinkedInvoices}
        onLinksChanged={() => void refreshIpLinks()}
        onRequestManualLinkToInvoice={(payId) => setFocusPaymentForLink(payId)}
      />
    </AdminWorkspace>
  )
}

export default PaymentRegisterWorkspace
