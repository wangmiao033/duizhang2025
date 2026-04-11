import React, { useMemo, useRef, useState } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import ChannelFormPageLayout from '@/components/channel/ChannelFormPageLayout.jsx'
import ChannelBillingForm from '@/components/channel/ChannelBillingForm.jsx'
import { VIEWS } from '@/app/routes.js'
import '@/components/reconciliation/reconciliation-admin.css'

const FORM_ID = 'channel-reconciliation-edit-form'

const TOOLS_PLACEHOLDER = (
  <span className="admin-workspace__card-desc" style={{ margin: 0 }}>
    渠道模板与快速填充预留；编辑时以当前记录为准，保存后返回渠道对账列表。
  </span>
)

function ChannelReconciliationEditPage() {
  const { recon, showToast, setActiveView, channelEditRecordId } = useAppState()
  const { channelRecords, onChannelUpdateRecord } = recon

  const submitIntentRef = useRef('back')
  const [previewAmount, setPreviewAmount] = useState(0)

  const editRecord = useMemo(
    () =>
      channelEditRecordId != null ? channelRecords.find((r) => r.id === channelEditRecordId) : null,
    [channelRecords, channelEditRecordId]
  )

  const goList = () => setActiveView(VIEWS.RECON_CHANNEL)

  const handleAfterSubmit = () => {
    goList()
  }

  if (channelEditRecordId == null) {
    return (
      <ChannelFormPageLayout
        toolsSlot={null}
        previewAmount={0}
        footerActions={
          <button type="button" className="rec-btn rec-btn--primary" onClick={goList}>
            返回列表
          </button>
        }
      >
        <div className="admin-workspace__card">
          <p className="admin-workspace__card-desc">请从渠道对账列表中选择一条记录，点击「编辑」进入本页。</p>
        </div>
      </ChannelFormPageLayout>
    )
  }

  if (!editRecord) {
    return (
      <ChannelFormPageLayout
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
            该条渠道数据可能已删除或不存在（id: {channelEditRecordId}）。
          </p>
        </div>
      </ChannelFormPageLayout>
    )
  }

  return (
    <ChannelFormPageLayout
      toolsSlot={TOOLS_PLACEHOLDER}
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
      <ChannelBillingForm
        formId={FORM_ID}
        mode="edit"
        recordId={editRecord.id}
        sourceRecord={editRecord}
        onUpdateRecord={onChannelUpdateRecord}
        submitIntentRef={submitIntentRef}
        onAfterSubmit={handleAfterSubmit}
        onPreviewChange={setPreviewAmount}
        onError={(msg) => showToast(msg, 'error')}
      />
    </ChannelFormPageLayout>
  )
}

export default ChannelReconciliationEditPage
