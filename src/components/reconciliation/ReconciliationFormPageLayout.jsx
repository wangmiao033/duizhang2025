import React from 'react'
import PageContainer from '@/components/layout/PageContainer.jsx'

/**
 * 研发对账「完整录入 / 完整编辑」共用页架：工具区 + 表单区 + 粘性底栏（预览金额 + 操作）
 * 全局 Header 已含标题时，页内不再重复大标题。
 */
function ReconciliationFormPageLayout({ toolsSlot, previewAmount, footerActions, children }) {
  return (
    <PageContainer hideHeader className="page-container--admin-workspace page-container--recon-form">
      <div className="admin-workspace rec-form-page">
        {toolsSlot ? (
          <section className="admin-workspace__card rec-form-page__tools-card">
            <h3 className="admin-workspace__card-title">快速填充与模板预设</h3>
            <p className="admin-workspace__card-desc">
              与列表页一致的费用/分成默认值来源；游戏名称可触发自动预设匹配（见表单内提示）。
            </p>
            <div className="rec-create-tools">{toolsSlot}</div>
          </section>
        ) : null}

        <div className="rec-form-page__form-wrap">{children}</div>

        <div className="rec-create-footer">
          <div className="rec-create-footer__preview">
            <span className="rec-create-footer__preview-label">预计结算金额</span>
            <span className="rec-create-footer__preview-value">¥{previewAmount.toFixed(2)}</span>
          </div>
          <div className="rec-create-footer__actions">{footerActions}</div>
        </div>
      </div>
    </PageContainer>
  )
}

export default ReconciliationFormPageLayout
