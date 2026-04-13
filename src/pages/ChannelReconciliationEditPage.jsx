import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import ChannelFormPageLayout from '@/components/channel/ChannelFormPageLayout.jsx'
import ChannelBillingForm from '@/components/channel/ChannelBillingForm.jsx'
import {
  apiChannelRowToFrontend,
  getChannelRecord
} from '@/lib/api/channel.ts'
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
  const [remoteRecord, setRemoteRecord] = useState(null)
  const [remoteLoadState, setRemoteLoadState] = useState('idle')

  const recordFromList = useMemo(() => {
    if (channelEditRecordId == null || channelEditRecordId === '') return null
    return channelRecords.find((r) => String(r.id) === String(channelEditRecordId)) ?? null
  }, [channelRecords, channelEditRecordId])

  useEffect(() => {
    if (channelEditRecordId == null || channelEditRecordId === '') {
      setRemoteRecord(null)
      setRemoteLoadState('idle')
      return
    }
    if (recordFromList) {
      setRemoteRecord(null)
      setRemoteLoadState('idle')
      return
    }
    const sid = String(channelEditRecordId)
    let cancelled = false
    setRemoteLoadState('loading')
    setRemoteRecord(null)
    ;(async () => {
      try {
        const row = await getChannelRecord(sid)
        if (cancelled) return
        setRemoteRecord(apiChannelRowToFrontend(row))
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
  }, [channelEditRecordId, recordFromList])

  const editRecord = recordFromList ?? remoteRecord

  const goList = () => setActiveView(VIEWS.RECON_CHANNEL)

  const handleAfterSubmit = () => {
    goList()
  }

  if (channelEditRecordId == null || channelEditRecordId === '') {
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

  if (remoteLoadState === 'loading' && !editRecord) {
    return (
      <ChannelFormPageLayout
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
            {remoteLoadState === 'error'
              ? '无法从服务器加载该渠道记录。'
              : '列表中暂无该条数据。'}
            <br />
            id: {String(channelEditRecordId)}
          </p>
        </div>
      </ChannelFormPageLayout>
    )
  }

  const stableRecord =
    editRecord && (!editRecord.id || editRecord.id === '')
      ? { ...editRecord, id: String(channelEditRecordId) }
      : editRecord

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
        recordId={stableRecord.id}
        sourceRecord={stableRecord}
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
