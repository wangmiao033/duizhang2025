import React from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import PageContainer from '@/components/layout/PageContainer.jsx'
import TagManager from '@/components/TagManager.jsx'
import HistoryPanel from '@/components/HistoryPanel.jsx'
import DataBackup from '@/components/DataBackup.jsx'
import ImportTemplateGenerator from '@/components/ImportTemplateGenerator.jsx'
import Settings from '@/components/Settings.jsx'
import { VIEWS } from '@/app/routes.js'

function SettingsHubPage({ section, onSettlementFormatChange }) {
  const { recon, settings, showToast } = useAppState()
  const { records, updateRecord, handleRestoreFromHistory, restoreFullData } = recon
  const { partyA, partyB, settlementMonth, partners, deliveries } = settings

  return (
    <PageContainer hideHeader>
      {section === VIEWS.SETTINGS_TAGS && (
        <TagManager
          records={records}
          onTagChange={(recordId, updatedRecord) => {
            if (updatedRecord && recordId) {
              updateRecord(recordId, updatedRecord)
              showToast('标签已更新', 'success')
            }
          }}
        />
      )}
      {section === VIEWS.SETTINGS_HISTORY && (
        <HistoryPanel onRestore={handleRestoreFromHistory} />
      )}
      {section === VIEWS.SETTINGS_BACKUP && (
        <div className="settings-tools">
          <DataBackup
            records={records}
            partyA={partyA}
            partyB={partyB}
            settlementMonth={settlementMonth}
            partners={partners}
            deliveries={deliveries}
            onImport={(data) => {
              restoreFullData(data)
              showToast('数据导入成功！', 'success')
            }}
          />
          <ImportTemplateGenerator
            onTemplateGenerated={(type, fileName) => {
              showToast(`模板 ${fileName} 已生成`, 'success')
            }}
          />
        </div>
      )}
      {section === VIEWS.SETTINGS_APP && (
        <div className="settings-app-embed">
          <Settings
            onSettingsChange={(s) => {
              if (s.settlementNumberFormat && onSettlementFormatChange) {
                onSettlementFormatChange(s.settlementNumberFormat)
              }
            }}
          />
          <p className="muted" style={{ marginTop: '12px' }}>
            标题栏中的齿轮按钮仍可快速打开相同设置。
          </p>
        </div>
      )}
    </PageContainer>
  )
}

export default SettingsHubPage
