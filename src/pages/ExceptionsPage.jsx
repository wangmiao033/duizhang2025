import React from 'react'
import { useAppState } from '@/app/AppStateContext.jsx'
import PageContainer from '@/components/layout/PageContainer.jsx'
import DataValidator from '@/components/DataValidator.jsx'
import DataRecoveryHelper from '@/components/DataRecoveryHelper.jsx'
import ExceptionCenterPanel from '@/components/exceptions/ExceptionCenterPanel.jsx'
import { useExceptionItems } from '@/hooks/useExceptionItems.js'
import { calculateSettlementAmount } from '@/domain/settlement/calculateSettlementAmount.js'
import { VIEWS } from '@/app/routes.js'
import '@/components/reconciliation/reconciliation-admin.css'

function ExceptionsPage() {
  const { recon, showToast, setActiveView } = useAppState()
  const { records, updateRecord, restoreFullData } = recon
  const { items: exceptionItems, refresh: refreshExceptions } = useExceptionItems()

  return (
    <PageContainer hideHeader className="page-container--admin-workspace">
      <div className="admin-workspace">
        <section className="admin-workspace__card">
          <h3 className="admin-workspace__card-title">业务异常 2.0</h3>
          <p className="admin-workspace__card-desc">
            自动识别发票/回款关联、渠道状态、研发结算等异常；仅展示与状态管理，不自动修复。处理状态保存在本地浏览器。
          </p>
          <ExceptionCenterPanel
            items={exceptionItems}
            refresh={refreshExceptions}
            setActiveView={setActiveView}
            showToast={showToast}
          />
        </section>

        <section className="admin-workspace__card">
          <h3 className="admin-workspace__card-title">数据诊断与恢复</h3>
          <p className="admin-workspace__card-desc">
            检查 localStorage 与备份快照，必要时从历史或备份恢复（沿用 DataRecoveryHelper）。
          </p>
          <DataRecoveryHelper
            records={records}
            onDataRestored={(data) => {
              restoreFullData(data)
              showToast('数据已恢复！', 'success')
            }}
          />
        </section>

        <section className="admin-workspace__card">
          <h3 className="admin-workspace__card-title">校验与异常列表</h3>
          <p className="admin-workspace__card-desc">
            以下为当前研发对账记录的校验结果；可跳转至研发对账列表定位记录。
          </p>
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
        </section>
      </div>
    </PageContainer>
  )
}

export default ExceptionsPage
