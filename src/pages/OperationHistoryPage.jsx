import React from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import PageContainer from '@/components/layout/PageContainer.jsx'
import ReconciliationPageHeader from '@/components/reconciliation/ReconciliationPageHeader.jsx'
import OperationHistoryView from '@/components/history/OperationHistoryView.jsx'
import '@/components/reconciliation/reconciliation-admin.css'

function OperationHistoryPage() {
  const { recon, showToast } = useAppState()
  const { handleRestoreFromHistory } = recon

  return (
    <PageContainer hideHeader className="page-container--admin-workspace">
      <div className="admin-workspace">
        <ReconciliationPageHeader
          title="操作历史"
          description="按时间与类型查看对账相关操作快照，可从列表恢复历史数据（与侧边栏入口一致）"
        />
        <div className="admin-workspace__card">
          <OperationHistoryView onRestore={handleRestoreFromHistory} showToast={showToast} />
        </div>
      </div>
    </PageContainer>
  )
}

export default OperationHistoryPage
