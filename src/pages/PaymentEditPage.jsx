import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import PaymentFormPageLayout from '@/components/payment/PaymentFormPageLayout.jsx'
import PaymentForm from '@/components/payment/PaymentForm.jsx'
import { apiPaymentRowToFrontend, getPayment } from '@/lib/api/payment.ts'
import { VIEWS } from '@/app/routes.js'
import '@/components/reconciliation/reconciliation-admin.css'

const FORM_ID = 'payment-edit-form'

function PaymentEditPage() {
  const { settings, showToast, setActiveView, paymentEditId } = useAppState()
  const { partners, deliveries, persistDelivery } = settings

  const submitIntentRef = useRef('back')
  const [remoteRecord, setRemoteRecord] = useState(null)
  const [remoteLoadState, setRemoteLoadState] = useState('idle')

  const recordFromList = useMemo(() => {
    if (paymentEditId == null || paymentEditId === '') return null
    return deliveries.find((d) => String(d.id) === String(paymentEditId)) ?? null
  }, [deliveries, paymentEditId])

  useEffect(() => {
    if (paymentEditId == null || paymentEditId === '') {
      setRemoteRecord(null)
      setRemoteLoadState('idle')
      return
    }
    if (recordFromList) {
      setRemoteRecord(null)
      setRemoteLoadState('idle')
      return
    }
    const sid = String(paymentEditId)
    let cancelled = false
    setRemoteLoadState('loading')
    setRemoteRecord(null)
    ;(async () => {
      try {
        const row = await getPayment(sid)
        if (cancelled) return
        setRemoteRecord(apiPaymentRowToFrontend(row))
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
  }, [paymentEditId, recordFromList])

  const editRecord = recordFromList ?? remoteRecord

  const goList = () => setActiveView(VIEWS.INVOICE_PAYMENT)

  const handleAfterSubmit = () => {
    goList()
  }

  if (paymentEditId == null) {
    return (
      <PaymentFormPageLayout
        toolsSlot={null}
        footerSummary={null}
        footerActions={
          <button type="button" className="rec-btn rec-btn--primary" onClick={goList}>
            返回列表
          </button>
        }
      >
        <div className="admin-workspace__card">
          <p className="admin-workspace__card-desc">请从回款登记列表选择记录并点击「编辑」进入本页。</p>
        </div>
      </PaymentFormPageLayout>
    )
  }

  if (remoteLoadState === 'loading' && !editRecord) {
    return (
      <PaymentFormPageLayout
        toolsSlot={null}
        footerSummary={null}
        footerActions={
          <button type="button" className="rec-btn rec-btn--primary" onClick={goList}>
            返回列表
          </button>
        }
      >
        <div className="admin-workspace__card">
          <p className="admin-workspace__card-desc">正在加载回款登记…</p>
        </div>
      </PaymentFormPageLayout>
    )
  }

  if (!editRecord) {
    return (
      <PaymentFormPageLayout
        toolsSlot={null}
        footerSummary={null}
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
              ? '无法从服务器加载该记录，请检查网络或列表是否仍包含此条。'
              : `数据可能已删除（id: ${paymentEditId}）。`}
          </p>
        </div>
      </PaymentFormPageLayout>
    )
  }

  return (
    <PaymentFormPageLayout
      toolsSlot={
        <span className="admin-workspace__card-desc" style={{ margin: 0 }}>
          编辑保存后返回列表。
        </span>
      }
      footerSummary={{ label: '编辑单号', value: editRecord.trackingNumber || '（待寄出）' }}
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
      <PaymentForm
        formId={FORM_ID}
        mode="edit"
        sourceRecord={editRecord}
        partners={partners}
        persistDelivery={persistDelivery}
        submitIntentRef={submitIntentRef}
        onAfterSubmit={handleAfterSubmit}
        onSaved={() => showToast('快递记录已更新', 'success')}
        showToast={showToast}
      />
    </PaymentFormPageLayout>
  )
}

export default PaymentEditPage
