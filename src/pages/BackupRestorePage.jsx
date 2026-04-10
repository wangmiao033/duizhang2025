import React from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import PageContainer from '@/components/layout/PageContainer.jsx'
import ReconciliationPageHeader from '@/components/reconciliation/ReconciliationPageHeader.jsx'
import BackupRestoreView from '@/components/backup/BackupRestoreView.jsx'
import '@/components/reconciliation/reconciliation-admin.css'

function BackupRestorePage() {
  const { recon, settings, showToast } = useAppState()
  const { records, restoreFullData } = recon
  const { partyA, partyB, settlementMonth, partners, deliveries } = settings

  return (
    <PageContainer hideHeader className="page-container--admin-workspace">
      <div className="admin-workspace">
        <ReconciliationPageHeader
          title="备份恢复"
          description="本地备份、JSON 文件导入导出与备份历史，能力与原先 DataBackup 一致"
        />
        <BackupRestoreView
          records={records}
          partyA={partyA}
          partyB={partyB}
          settlementMonth={settlementMonth}
          partners={partners}
          deliveries={deliveries}
          onImport={(data) => {
            restoreFullData(data)
          }}
          showToast={showToast}
        />
      </div>
    </PageContainer>
  )
}

export default BackupRestorePage
