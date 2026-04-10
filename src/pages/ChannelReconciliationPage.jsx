import React from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import PageContainer from '@/components/layout/PageContainer.jsx'
import ChannelBilling from '@/components/ChannelBilling.jsx'

function ChannelReconciliationPage() {
  const { recon } = useAppState()
  const { channelRecords, onChannelAddRecord, onChannelUpdateRecord, onChannelDeleteRecord } = recon

  return (
    <PageContainer title="渠道对账" description="渠道流水、分成与结算维护">
      <ChannelBilling
        channelRecords={channelRecords}
        onAddRecord={onChannelAddRecord}
        onUpdateRecord={onChannelUpdateRecord}
        onDeleteRecord={onChannelDeleteRecord}
      />
    </PageContainer>
  )
}

export default ChannelReconciliationPage
