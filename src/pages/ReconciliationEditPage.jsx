import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import DataForm from '@/components/DataForm.jsx'
import QuickFill from '@/components/QuickFill.jsx'
import TemplatePresets from '@/components/TemplatePresets.jsx'
import ReconciliationFormPageLayout from '@/components/reconciliation/ReconciliationFormPageLayout.jsx'
import ReconciliationRdPaymentsDrawer from '@/components/reconciliation/ReconciliationRdPaymentsDrawer.jsx'
import { showNotification } from '@/components/NotificationCenter.jsx'
import { VIEWS } from '@/app/routes.js'
import {
  apiRowToFrontend,
  getReconciliationRecord,
  getReconciliationRecordId
} from '@/lib/api/reconciliation.ts'
import { displaySettlementNumber } from '@/utils/settlementNumber.js'
import '@/components/reconciliation/reconciliation-admin.css'

const FORM_ID = 'reconciliation-edit-form'

function ReconciliationEditPage() {
  const {
    recon,
    settings,
    showToast,
    setActiveView,
    reconEditRecordId,
    navigateBankPaymentForReconciliation
  } = useAppState()
  const { records, updateRecord, handleApplyTemplate, quickFillData, setQuickFillData } = recon
  const { settlementMonth, partners, setPartners } = settings

  const submitIntentRef = useRef('back')
  const [previewAmount, setPreviewAmount] = useState(0)
  const [remoteRecord, setRemoteRecord] = useState(null)
  const [remoteLoadState, setRemoteLoadState] = useState('idle')
  const [rdPaymentsDrawer, setRdPaymentsDrawer] = useState({
    open: false,
    reconciliationId: '',
    statementNo: ''
  })

  const recordFromList = useMemo(() => {
    if (reconEditRecordId == null || reconEditRecordId === '') return null
    return records.find((r) => String(r.id) === String(reconEditRecordId)) ?? null
  }, [records, reconEditRecordId])

  useEffect(() => {
    if (reconEditRecordId == null || reconEditRecordId === '') {
      setRemoteRecord(null)
      setRemoteLoadState('idle')
      return
    }
    if (recordFromList) {
      setRemoteRecord(null)
      setRemoteLoadState('idle')
      return
    }
    const sid = String(reconEditRecordId)
    let cancelled = false
    setRemoteLoadState('loading')
    setRemoteRecord(null)
    ;(async () => {
      try {
        const row = await getReconciliationRecord(sid)
        if (cancelled) return
        setRemoteRecord(apiRowToFrontend(row))
        setRemoteLoadState('idle')
      } catch (e) {
        console.error(e)
        if (!cancelled) {
          setRemoteRecord(null)
          setRemoteLoadState('error')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reconEditRecordId, recordFromList])

  const editRecord = recordFromList ?? remoteRecord

  const goList = () => setActiveView(VIEWS.RECON_RD)

  const onTemplateApply = (template) => {
    handleApplyTemplate(template)
    setQuickFillData((prev) => ({
      ...(prev && typeof prev === 'object' ? prev : {}),
      channelFeeRate: template.channelFeeRate,
      taxPoint: template.taxPoint,
      revenueShareRatio: template.revenueShareRatio,
      discount: template.discount,
      ...(template.testingFee != null ? { testingFee: String(template.testingFee) } : {})
    }))
  }

  const handleSubmitted = () => {
    showToast('记录已保存', 'success')
    goList()
  }

  if (reconEditRecordId == null || reconEditRecordId === '') {
    return (
      <ReconciliationFormPageLayout
        toolsSlot={null}
        previewAmount={0}
        footerActions={
          <button type="button" className="rec-btn rec-btn--primary" onClick={goList}>
            返回列表
          </button>
        }
      >
        <div className="admin-workspace__card">
          <p className="admin-workspace__card-desc">请从研发对账列表中选择一条记录，点击「编辑」进入本页。</p>
        </div>
      </ReconciliationFormPageLayout>
    )
  }

  if (remoteLoadState === 'loading' && !editRecord) {
    return (
      <ReconciliationFormPageLayout
        toolsSlot={null}
        previewAmount={0}
        footerActions={
          <button type="button" className="rec-btn rec-btn--ghost" onClick={goList}>
            返回列表
          </button>
        }
      >
        <div className="admin-workspace__card">
          <p className="admin-workspace__card-desc">正在加载记录…</p>
        </div>
      </ReconciliationFormPageLayout>
    )
  }

  if (!editRecord) {
    return (
      <ReconciliationFormPageLayout
        toolsSlot={null}
        previewAmount={0}
        footerActions={
          <button type="button" className="rec-btn rec-btn--primary" onClick={goList}>
            返回列表
          </button>
        }
      >
        <div className="admin-workspace__card">
          <h3 className="admin-workspace__card-title">未找到记录</h3>
          <p className="admin-workspace__card-desc">
            {remoteLoadState === 'error'
              ? '无法从服务器加载该记录，请检查网络或主键是否正确。'
              : '列表中暂无该条数据，且未能从服务器拉取（请确认 id 与后端一致）。'}
            <br />
            id: {String(reconEditRecordId)}
          </p>
        </div>
      </ReconciliationFormPageLayout>
    )
  }

  const stableEditRecord =
    editRecord && getReconciliationRecordId(editRecord) === ''
      ? { ...editRecord, id: String(reconEditRecordId) }
      : editRecord

  return (
    <ReconciliationFormPageLayout
      toolsSlot={
        <>
          <QuickFill
            onFill={(data) => {
              setQuickFillData(data)
              showNotification('快速填充模板已应用', 'success')
            }}
          />
          <TemplatePresets onApplyTemplate={onTemplateApply} />
        </>
      }
      previewAmount={previewAmount}
      footerActions={
        <>
          <button type="button" className="rec-btn rec-btn--ghost" onClick={goList}>
            返回列表
          </button>
          <button
            type="button"
            className="rec-btn rec-btn--primary"
            onClick={() => {
              submitIntentRef.current = 'back'
              document.getElementById(FORM_ID)?.requestSubmit()
            }}
          >
            保存
          </button>
        </>
      }
    >
      <div className="admin-workspace__card" style={{ marginBottom: 16 }}>
        <h3 className="admin-workspace__card-title" style={{ marginTop: 0 }}>
          银行付款关联
        </h3>
        <dl className="rec-light-dl">
          <dt>支付状态</dt>
          <dd>
            {stableEditRecord.paymentStatus != null
              ? String(stableEditRecord.paymentStatus)
              : '未付款'}
          </dd>
          <dt>已付金额</dt>
          <dd>¥{parseFloat(stableEditRecord.paidAmount ?? 0).toFixed(2)}</dd>
          <dt>未付金额</dt>
          <dd>¥{parseFloat(stableEditRecord.unpaidAmount ?? 0).toFixed(2)}</dd>
          <dt>最近付款</dt>
          <dd>
            {stableEditRecord.latestPaymentDate
              ? String(stableEditRecord.latestPaymentDate).slice(0, 10)
              : '—'}
          </dd>
          <dt>关联笔数</dt>
          <dd>
            {stableEditRecord.paymentCount != null ? String(stableEditRecord.paymentCount) : '0'}
          </dd>
        </dl>
        <div className="rec-light-field rec-light-field--row" style={{ marginBottom: 0 }}>
          <button
            type="button"
            className="rec-btn rec-btn--ghost"
            onClick={() => {
              const id = getReconciliationRecordId(stableEditRecord)
              if (!id) {
                showToast('缺少主键，无法跳转付款登记', 'error')
                return
              }
              navigateBankPaymentForReconciliation(id)
            }}
          >
            关联付款
          </button>
          <button
            type="button"
            className="rec-btn rec-btn--ghost"
            onClick={() => {
              const id = getReconciliationRecordId(stableEditRecord)
              if (!id) return
                           setRdPaymentsDrawer({
                open: true,
                reconciliationId: id,
                statementNo: displaySettlementNumber(
                  stableEditRecord.settlementNumber != null
                    ? String(stableEditRecord.settlementNumber)
                    : '',
                  { emptyLabel: '' }
                )
              })
            }}
          >
            查看付款
          </button>
        </div>
      </div>
      <DataForm
        formId={FORM_ID}
        layout="createPage"
        mode="edit"
        editRecord={stableEditRecord}
        showSubmitButton={false}
        submitIntentRef={submitIntentRef}
        onPreviewChange={setPreviewAmount}
        onSubmitted={handleSubmitted}
        onUpdateRecord={updateRecord}
        settlementMonth={settlementMonth}
        onError={(msg) => showToast(msg, 'error')}
        quickFillData={quickFillData}
        partners={partners}
        onAddPartner={(name) => {
          const newPartner = {
            id: Date.now(),
            name,
            category: '游戏研发商',
            tag2: '',
            createdAt: new Date().toISOString()
          }
          setPartners([...partners, newPartner])
          showToast(`客户"${name}"已添加到客户库`, 'success')
        }}
      />
      <ReconciliationRdPaymentsDrawer
        open={rdPaymentsDrawer.open}
        reconciliationId={rdPaymentsDrawer.reconciliationId}
        statementNo={rdPaymentsDrawer.statementNo}
        onClose={() =>
          setRdPaymentsDrawer({ open: false, reconciliationId: '', statementNo: '' })
        }
      />
    </ReconciliationFormPageLayout>
  )
}

export default ReconciliationEditPage
