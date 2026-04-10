import React from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import PageContainer from '@/components/layout/PageContainer.jsx'
import DeliveryCenter from '@/components/DeliveryCenter.jsx'
import { sumVerifiedSettlementAmount } from '@/domain/invoice/invoiceVerification.js'
import { VIEWS } from '@/app/routes.js'

function InvoicePage({ section }) {
  const { invoice, recon, settings, showToast } = useAppState()
  const { records } = recon
  const { partners, deliveries, setDeliveries } = settings

  const {
    invoiceForm,
    setInvoiceForm,
    filteredInvoices,
    invoiceFilter,
    setInvoiceFilter,
    invoiceFileInputRef,
    handleAddInvoice,
    handleDeleteInvoice,
    handleOpenVerification,
    handleExportInvoiceJSON,
    handleExportInvoiceCSV,
    handleImportInvoiceJSON,
    parseInvoiceFromFilename
  } = invoice

  const titles = {
    [VIEWS.INVOICE_MANAGE]: '发票管理',
    [VIEWS.INVOICE_VERIFY]: '发票核销',
    [VIEWS.INVOICE_PAYMENT]: '回款登记'
  }

  const invoiceList = (
    <div className="invoice-list" style={{ width: '100%' }}>
      <div className="list-header">
        <div className="list-title">
          <h3>发票列表</h3>
          <span className="muted">共 {filteredInvoices.length} 条</span>
        </div>
        <div className="invoice-toolbar">
          <input
            type="text"
            placeholder="搜索抬头/税号/备注"
            value={invoiceFilter.keyword}
            onChange={(e) => setInvoiceFilter({ ...invoiceFilter, keyword: e.target.value })}
          />
          <select
            value={invoiceFilter.status}
            onChange={(e) => setInvoiceFilter({ ...invoiceFilter, status: e.target.value })}
          >
            <option value="全部">全部</option>
            <option value="未开">未开</option>
            <option value="已开">已开</option>
            <option value="作废">作废</option>
          </select>
          {section === VIEWS.INVOICE_MANAGE && (
            <>
              <button type="button" className="secondary-btn" onClick={handleExportInvoiceJSON}>
                导出 JSON
              </button>
              <button type="button" className="secondary-btn" onClick={handleExportInvoiceCSV}>
                导出 CSV
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => invoiceFileInputRef.current?.click()}
              >
                导入 (JSON/PDF)
              </button>
              <input
                ref={invoiceFileInputRef}
                type="file"
                accept=".json,.pdf"
                style={{ display: 'none' }}
                onChange={handleImportInvoiceJSON}
              />
            </>
          )}
        </div>
      </div>
      {filteredInvoices.length === 0 ? (
        <div className="empty-invoice">暂无发票记录</div>
      ) : (
        <div className="invoice-table">
          <div className="invoice-table-head">
            <span>抬头</span>
            <span>税号</span>
            <span>金额</span>
            <span>状态</span>
            <span>开票日期</span>
            <span>核销状态</span>
            <span>备注</span>
            <span>操作</span>
          </div>
          {filteredInvoices.map((item) => {
            const verifiedRecordIds = item.verifiedRecordIds || []
            const verifiedAmount = sumVerifiedSettlementAmount(records, verifiedRecordIds)

            return (
              <div className="invoice-table-row" key={item.id}>
                <span title={item.title}>{item.title || '-'}</span>
                <span title={item.taxNo}>{item.taxNo || '-'}</span>
                <span>¥{item.amount || '0.00'}</span>
                <span className={`tag tag-${item.status}`}>{item.status}</span>
                <span>{item.issueDate || '-'}</span>
                <span>
                  {item.verified ? (
                    <span
                      className="tag tag-verified"
                      title={`已核销 ${verifiedRecordIds.length} 条记录，金额 \uFFE5${verifiedAmount.toFixed(2)}`}
                    >
                      已核销 ({verifiedRecordIds.length})
                    </span>
                  ) : (
                    <span className="tag tag-unverified">未核销</span>
                  )}
                </span>
                <span title={item.remark}>{item.remark || '-'}</span>
                <span>
                  <button
                    type="button"
                    className="verify-btn"
                    onClick={() => handleOpenVerification(item)}
                    title="核销发票"
                  >
                    核销
                  </button>
                  {section === VIEWS.INVOICE_MANAGE && (
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => handleDeleteInvoice(item.id)}
                    >
                      删除
                    </button>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  if (section === VIEWS.INVOICE_PAYMENT) {
    return (
      <PageContainer title={titles[section]} description="快递与寄送登记（原快递中心）">
        <DeliveryCenter
          deliveries={deliveries}
          onDeliveriesChange={(newDeliveries) => {
            setDeliveries(newDeliveries)
            showToast('快递记录已更新', 'success')
          }}
          partners={partners}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title={titles[section] || '发票'}
      description={
        section === VIEWS.INVOICE_VERIFY ? '在列表中点击「核销」勾选对账记录' : '发票抬头、金额与导出'
      }
    >
      <div className="invoice-section">
        {section === VIEWS.INVOICE_MANAGE ? (
          <div className="invoice-grid">
            <form className="invoice-form" onSubmit={handleAddInvoice}>
              <h3>发票信息</h3>
              <div className="invoice-row">
                <label>发票抬头 *</label>
                <input
                  type="text"
                  value={invoiceForm.title}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, title: e.target.value })}
                  placeholder="公司名称"
                />
              </div>
              <div className="invoice-row">
                <label>税号 *</label>
                <input
                  type="text"
                  value={invoiceForm.taxNo}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, taxNo: e.target.value })}
                  placeholder="纳税人识别号"
                />
              </div>
              <div className="invoice-row two-col">
                <div>
                  <label>开票金额(元)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label>开票日期</label>
                  <input
                    type="date"
                    value={invoiceForm.issueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="invoice-row two-col">
                <div>
                  <label>状态</label>
                  <select
                    value={invoiceForm.status}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value })}
                  >
                    <option value="未开">未开</option>
                    <option value="已开">已开</option>
                    <option value="作废">作废</option>
                  </select>
                </div>
                <div>
                  <label>备注</label>
                  <input
                    type="text"
                    value={invoiceForm.remark}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, remark: e.target.value })}
                    placeholder="可填写收件人、邮箱等"
                  />
                </div>
              </div>
              <div className="invoice-form-actions">
                <button type="submit" className="submit-btn">
                  保存发票记录
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    const filename = prompt(
                      '请输入发票文件名（格式：销售方+购买方+金额+日期），例如：深圳龙魂+广州熊动22557.99+20260126'
                    )
                    if (filename) {
                      const parsedInfo = parseInvoiceFromFilename(filename)
                      if (parsedInfo) {
                        setInvoiceForm({
                          ...invoiceForm,
                          ...parsedInfo
                        })
                        showToast('已解析发票信息，请确认并补充税号后保存', 'success')
                      } else {
                        showToast('文件名格式不正确', 'error')
                      }
                    }
                  }}
                  title="从文件名快速解析发票信息"
                >
                  快速录入
                </button>
              </div>
            </form>
            {invoiceList}
          </div>
        ) : (
          invoiceList
        )}
      </div>
    </PageContainer>
  )
}

export default InvoicePage
