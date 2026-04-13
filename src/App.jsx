import React, { useState, useCallback, useEffect, useRef } from 'react'
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
import '@/styles/admin-polish.css'
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
import OperationHistoryPage from './pages/OperationHistoryPage.jsx'
import BackupRestorePage from './pages/BackupRestorePage.jsx'
import ReconciliationCreatePage from './pages/ReconciliationCreatePage.jsx'
import ReconciliationEditPage from './pages/ReconciliationEditPage.jsx'
import ChannelReconciliationCreatePage from './pages/ChannelReconciliationCreatePage.jsx'
import ChannelReconciliationEditPage from './pages/ChannelReconciliationEditPage.jsx'
import InvoiceCreatePage from './pages/InvoiceCreatePage.jsx'
import InvoiceEditPage from './pages/InvoiceEditPage.jsx'
import PaymentCreatePage from './pages/PaymentCreatePage.jsx'
import PaymentEditPage from './pages/PaymentEditPage.jsx'
import BankStatementImportPage from './pages/BankStatementImportPage.jsx'
import BankPaymentRegisterPage from './pages/BankPaymentRegisterPage.jsx'
import BankCollectionRegisterPage from './pages/BankCollectionRegisterPage.jsx'

function App() {
  const [activeView, setActiveViewRaw] = useState(VIEWS.DASHBOARD)
  const [reconEditRecordId, setReconEditRecordId] = useState(null)
  const [channelEditRecordId, setChannelEditRecordId] = useState(null)
  const [invoiceEditId, setInvoiceEditId] = useState(null)
  const [paymentEditId, setPaymentEditId] = useState(null)
  const prevActiveViewRef = useRef(activeView)
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' })

  const showToast = useCallback((message, type = 'success') => {
    setToast({ isVisible: true, message, type })
    showNotification(message, type, 3000)
  }, [])

  const settings = useSettingsStore({ showToast })
  const recon = useReconciliationStore(settings, showToast)
  const invoice = useInvoiceStore({ showToast })
  const { resetInvoiceForm } = invoice

  const navigate = useCallback(
    (view) => {
      if (view === VIEWS.INVOICE_CREATE) {
        resetInvoiceForm()
      }
      setActiveViewRaw(view)
    },
    [resetInvoiceForm]
  )

  const hideToast = useCallback(() => {
    setToast((t) => ({ ...t, isVisible: false }))
  }, [])

  useEffect(() => {
    if (prevActiveViewRef.current === VIEWS.RECON_EDIT && activeView !== VIEWS.RECON_EDIT) {
      setReconEditRecordId(null)
    }
    if (
      prevActiveViewRef.current === VIEWS.CHANNEL_RECON_EDIT &&
      activeView !== VIEWS.CHANNEL_RECON_EDIT
    ) {
      setChannelEditRecordId(null)
    }
    if (prevActiveViewRef.current === VIEWS.INVOICE_EDIT && activeView !== VIEWS.INVOICE_EDIT) {
      setInvoiceEditId(null)
    }
    if (prevActiveViewRef.current === VIEWS.PAYMENT_EDIT && activeView !== VIEWS.PAYMENT_EDIT) {
      setPaymentEditId(null)
    }
    prevActiveViewRef.current = activeView
  }, [activeView])

  useKeyboardShortcuts({
    'ctrl+s': (e) => {
      e?.preventDefault()
    },
    'ctrl+f': (e) => {
      e?.preventDefault()
      const globalSearch = document.querySelector('#global-admin-search')
      const searchInput = document.querySelector('.search-input')
      ;(globalSearch || searchInput)?.focus()
    },
    'ctrl+p': (e) => {
      e?.preventDefault()
      if (recon.records.length > 0) {
        const printBtn = document.querySelector('.print-btn')
        if (printBtn) printBtn.click()
      }
    }
  })

  const openReconciliationEdit = useCallback((id) => {
    setReconEditRecordId(id)
    setActiveViewRaw(VIEWS.RECON_EDIT)
  }, [])

  const openChannelReconciliationEdit = useCallback((id) => {
    setChannelEditRecordId(id)
    setActiveViewRaw(VIEWS.CHANNEL_RECON_EDIT)
  }, [])

  const openInvoiceEdit = useCallback((id) => {
    setInvoiceEditId(id)
    setActiveViewRaw(VIEWS.INVOICE_EDIT)
  }, [])

  const openPaymentEdit = useCallback((id) => {
    setPaymentEditId(id)
    setActiveViewRaw(VIEWS.PAYMENT_EDIT)
  }, [])

  const appCtx = {
    settings,
    recon,
    invoice,
    showToast,
    setActiveView: navigate,
    setActiveViewRaw,
    activeView,
    reconEditRecordId,
    openReconciliationEdit,
    channelEditRecordId,
    openChannelReconciliationEdit,
    invoiceEditId,
    openInvoiceEdit,
    paymentEditId,
    openPaymentEdit
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
      case VIEWS.RECON_CREATE:
        return <ReconciliationCreatePage />
      case VIEWS.RECON_EDIT:
        return <ReconciliationEditPage />
      case VIEWS.RECON_MASTER:
        return <ReconciliationPage variant="master" />
      case VIEWS.RECON_CHANNEL:
        return <ChannelReconciliationPage />
      case VIEWS.CHANNEL_RECON_CREATE:
        return <ChannelReconciliationCreatePage />
      case VIEWS.CHANNEL_RECON_EDIT:
        return <ChannelReconciliationEditPage />
      case VIEWS.RECON_EXCEPTIONS:
        return <ExceptionsPage />
      case VIEWS.RECON_HISTORY:
        return <OperationHistoryPage />
      case VIEWS.DATA_BACKUP_RESTORE:
        return <BackupRestorePage />
      case VIEWS.BANK_STATEMENT_IMPORT:
        return <BankStatementImportPage />
      case VIEWS.BANK_PAYMENT_REGISTER:
        return <BankPaymentRegisterPage />
      case VIEWS.BANK_COLLECTION_REGISTER:
        return <BankCollectionRegisterPage />
      case VIEWS.SETTLE_MONTHLY:
      case VIEWS.SETTLE_CHANNEL:
      case VIEWS.SETTLE_STATUS:
        return <SettlementPage section={activeView} />
      case VIEWS.INVOICE_MANAGE:
      case VIEWS.INVOICE_VERIFY:
      case VIEWS.INVOICE_PAYMENT:
        return <InvoicePage section={activeView} />
      case VIEWS.INVOICE_CREATE:
        return <InvoiceCreatePage />
      case VIEWS.INVOICE_EDIT:
        return <InvoiceEditPage />
      case VIEWS.PAYMENT_CREATE:
        return <PaymentCreatePage />
      case VIEWS.PAYMENT_EDIT:
        return <PaymentEditPage />
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
          onNavigate={navigate}
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
                      recon.records.map((record) => {
                        const rid = String(record.id)
                        const selected = verificationRecordIds.some((x) => String(x) === rid)
                        return (
                        <label key={rid} className="record-checkbox-item">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setVerificationRecordIds(
                                  selected ? verificationRecordIds : [...verificationRecordIds, rid]
                                )
                              } else {
                                setVerificationRecordIds(
                                  verificationRecordIds.filter((id) => String(id) !== rid)
                                )
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
                      )})
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
          onConfirm={() =>
            handleConfirmVerification(
              sumVerifiedSettlementAmount(recon.records, verificationRecordIds)
            )
          }
          onCancel={handleCancelVerification}
          confirmText="确认核销"
          cancelText="取消"
        />
      </AppStateProvider>
    </ErrorBoundary>
  )
}

export default App
