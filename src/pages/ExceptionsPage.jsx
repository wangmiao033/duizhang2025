import React from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import PageContainer from '@/components/layout/PageContainer.jsx'
import DataValidator from '@/components/DataValidator.jsx'
import { calculateSettlementAmount } from '@/domain/settlement/calculateSettlementAmount.js'
import { VIEWS } from '@/app/routes.js'

function ExceptionsPage() {
  const { recon, showToast, setActiveView } = useAppState()
  const { records, updateRecord } = recon

  return (
    <PageContainer
      title="异常中心"
      description="数据校验问题集中查看，可从工作台跳转或在此处理"
    >
      <DataValidator
        records={records}
        calculateSettlementAmount={calculateSettlementAmount}
        onIssueClick={() => {
          setActiveView(VIEWS.RECON_RD)
          showToast('请在对账列表中定位并修复该记录', 'info')
        }}
        onAutoFix={(recordId, field, value) => {
          const record = records.find((r) => r.id === recordId)
          if (record) {
            const updatedRecord = { ...record, [field]: value }
            updateRecord(recordId, updatedRecord)
            showToast(`已自动修复记录 #${records.indexOf(record) + 1} 的${field}`, 'success')
          }
        }}
      />
    </PageContainer>
  )
}

export default ExceptionsPage
