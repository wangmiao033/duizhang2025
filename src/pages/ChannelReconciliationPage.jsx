import React from 'react'
import PageContainer from '@/components/layout/PageContainer.jsx'
import ChannelBilling from '@/components/ChannelBilling.jsx'
import { useAppState } from '@/app/AppStateContext.jsx'

function ChannelReconciliationPage() {
  const { recon } = useAppState()
  const {
    channelRecords,
    onChannelAddRecord,
    onChannelAddRecordsBatch,
    onChannelUpdateRecord,
    onChannelDeleteRecord
  } = recon

  return (
    <PageContainer hideHeader className="page-container--recon-rd">
      <ChannelBilling
        channelRecords={channelRecords}
        onAddRecord={onChannelAddRecord}
        onAddRecordsBatch={onChannelAddRecordsBatch}
        onUpdateRecord={onChannelUpdateRecord}
        onDeleteRecord={onChannelDeleteRecord}
      />
    </PageContainer>
  )
}

export default ChannelReconciliationPage
