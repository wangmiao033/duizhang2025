import React from 'react'
import DataBackup from '@/components/DataBackup.jsx'
import './BackupRestoreView.css'

/**
 * 备份恢复工作区：仅承载 DataBackup，分区样式由页面与 CSS 描述
 */
function BackupRestoreView({
  records,
  partyA,
  partyB,
  settlementMonth,
  partners,
  deliveries,
  onImport,
  showToast
}) {
  return (
    <div className="backup-restore-view">
      <section className="backup-restore-view__section">
        <h3 className="backup-restore-view__heading">本地备份与文件</h3>
        <p className="backup-restore-view__hint">
          支持浏览器本地备份、导出 JSON 文件、从文件导入及备份历史管理，逻辑与原先一致。
        </p>
        <DataBackup
          records={records}
          partyA={partyA}
          partyB={partyB}
          settlementMonth={settlementMonth}
          partners={partners}
          deliveries={deliveries}
          onImport={(data) => {
            onImport(data)
            showToast?.('数据导入成功！', 'success')
          }}
        />
      </section>
    </div>
  )
}

export default BackupRestoreView
