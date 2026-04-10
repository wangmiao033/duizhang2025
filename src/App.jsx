import React, { useState, useCallback } from 'react'
import './App.css'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import ConfirmDialog from './components/ConfirmDialog.jsx'
import Toast from './components/Toast.jsx'
import { showNotification } from './components/NotificationCenter.jsx'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js'
import { sumVerifiedSettlementAmount } from './domain/invoice/invoiceVerification.js'
import { useSettingsStore } from './store/useSettingsStore.js'
import { useReconciliationStore } from './store/useReconciliationStore.js'
import { useInvoiceStore } from './store/useInvoiceStore.js'
import AppShell from './app/AppShell.jsx'
import { AppStateProvider } from './app/AppStateContext.jsx'
import { VIEWS } from './app/routes.js'
import DashboardPage from './pages/DashboardPage.jsx'
import ReconciliationPage from './pages/ReconciliationPage.jsx'
import ChannelReconciliationPage from './pages/ChannelReconciliationPage.jsx'
import ExceptionsPage from './pages/ExceptionsPage.jsx'
import SettlementPage from './pages/SettlementPage.jsx'
import InvoicePage from './pages/InvoicePage.jsx'
import PartnerPage from './pages/PartnerPage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'
import SettingsHubPage from './pages/SettingsHubPage.jsx'
import RemindersPage from './pages/RemindersPage.jsx'

function App() {
  const [activeView, setActiveView] = useState(VIEWS.DASHBOARD)
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' })

  const showToast = useCallback((message, type = 'success') => {
    setToast({ isVisible: true, message, type })
    showNotification(message, type, 3000)
  }, [])

  const settings = useSettingsStore()
  const recon = useReconciliationStore(settings, showToast)
  const invoice = useInvoiceStore({ showToast })

  const hideToast = useCallback(() => {
    setToast((t) => ({ ...t, isVisible: false }))
  }, [])

  useKeyboardShortcuts({
    'ctrl+s': (e) => {
      e?.preventDefault()
    },
    'ctrl+f': (e) => {
      e?.preventDefault()
      const searchInput = document.querySelector('.search-input')
      if (searchInput) searchInput.focus()
    },
    'ctrl+p': (e) => {
      e?.preventDefault()
      if (recon.records.length > 0) {
        const printBtn = document.querySelector('.print-btn')
        if (printBtn) printBtn.click()
      }
    }
  })

  const appCtx = {
    settings,
    recon,
    invoice,
    showToast,
    setActiveView,
    activeView
  }

  const handleHeaderSettingsChange = (s) => {
    if (s.settlementNumberFormat) {
      settings.setSettlementNumberFormat(s.settlementNumberFormat)
    }
  }

  const renderView = () => {
    switch (activeView) {
      case VIEWS.DASHBOARD:
        return <DashboardPage />
      case VIEWS.RECON_RD:
        return <ReconciliationPage variant="full" />
      case VIEWS.RECON_MASTER:
        return <ReconciliationPage variant="master" />
      case VIEWS.RECON_CHANNEL:
        return <ChannelReconciliationPage />
      case VIEWS.RECON_EXCEPTIONS:
        return <ExceptionsPage />
      case VIEWS.SETTLE_MONTHLY:
      case VIEWS.SETTLE_CHANNEL:
      case VIEWS.SETTLE_STATUS:
        return <SettlementPage section={activeView} />
      case VIEWS.INVOICE_MANAGE:
      case VIEWS.INVOICE_VERIFY:
      case VIEWS.INVOICE_PAYMENT:
        return <InvoicePage section={activeView} />
      case VIEWS.PARTNER_CONTACTS:
      case VIEWS.PARTNER_GAMES:
      case VIEWS.PARTNER_COMPANY:
        return <PartnerPage section={activeView} />
      case VIEWS.REPORTS_IMPORT:
      case VIEWS.REPORTS_EXPORT:
      case VIEWS.REPORTS_STATS:
      case VIEWS.REPORTS_PROFIT:
        return <ReportsPage section={activeView} />
      case VIEWS.SETTINGS_TAGS:
      case VIEWS.SETTINGS_HISTORY:
      case VIEWS.SETTINGS_BACKUP:
      case VIEWS.SETTINGS_APP:
        return (
          <SettingsHubPage section={activeView} onSettlementFormatChange={settings.setSettlementNumberFormat} />
        )
      case VIEWS.SETTINGS_REMINDERS:
        return <RemindersPage />
      default:
        return <DashboardPage />
    }
  }

  const {
    showVerificationDialog,
    selectedInvoiceForVerification,
    verificationRecordIds,
    setVerificationRecordIds,
    handleConfirmVerification,
    handleCancelVerification
  } = invoice

  return (
    <ErrorBoundary>
      <AppStateProvider value={appCtx}>
        <AppShell
          activeView={activeView}
          onNavigate={setActiveView}
          onSettingsChange={handleHeaderSettingsChange}
        >
          {renderView()}
        </AppShell>

        <ConfirmDialog
          isOpen={recon.showDeleteConfirm}
          title="确认删除"
          message="确定要删除这条记录吗？此操作无法撤销。"
          onConfirm={recon.confirmDelete}
          onCancel={recon.cancelDelete}
          confirmText="删除"
          cancelText="取消"
        />

        <ConfirmDialog
          isOpen={recon.showBatchDeleteConfirm}
          title="确认批量删除"
          message={`确定要删除选中的 ${recon.selectedIds.length} 条记录吗？此操作无法撤销。`}
          onConfirm={recon.confirmBatchDelete}
          onCancel={recon.cancelBatchDelete}
          confirmText="删除"
          cancelText="取消"
        />

        <Toast isVisible={toast.isVisible} message={toast.message} type={toast.type} onClose={hideToast} />

        <ConfirmDialog
          isOpen={showVerificationDialog}
          title="发票核销"
          message={
            selectedInvoiceForVerification ? (
              <div className="verification-dialog-content">
                <div className="invoice-info">
                  <p>
                    <strong>发票抬头：</strong>
                    {selectedInvoiceForVerification.title}
                  </p>
                  <p>
                    <strong>发票金额：</strong>¥{selectedInvoiceForVerification.amount || '0.00'}
                  </p>
                </div>
                <div className="verification-records">
                  <label>选择要核销的对账记录：</label>
                  <div className="records-checkbox-list">
                    {recon.records.length === 0 ? (
                      <p className="no-records">暂无对账记录</p>
                    ) : (
                      recon.records.map((record) => (
                        <label key={record.id} className="record-checkbox-item">
                          <input
                            type="checkbox"
                            checked={verificationRecordIds.includes(record.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setVerificationRecordIds([...verificationRecordIds, record.id])
                              } else {
                                setVerificationRecordIds(verificationRecordIds.filter((id) => id !== record.id))
                              }
                            }}
                          />
                          <span>
                            {record.settlementMonth || '未设置月份'} - {record.partner || '未设置合作方'} -{' '}
                            {record.game || '未设置游戏'}
                            <strong className="amount">
                              {' '}
                              (¥{parseFloat(record.settlementAmount || 0).toFixed(2)})
                            </strong>
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  {verificationRecordIds.length > 0 && (
                    <div className="verification-summary">
                      <p>已选择 {verificationRecordIds.length} 条记录</p>
                      <p>
                        核销金额：¥
                        {sumVerifiedSettlementAmount(recon.records, verificationRecordIds).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              ''
            )
          }
          onConfirm={handleConfirmVerification}
          onCancel={handleCancelVerification}
          confirmText="确认核销"
          cancelText="取消"
        />
      </AppStateProvider>
    </ErrorBoundary>
  )
}

export default App
