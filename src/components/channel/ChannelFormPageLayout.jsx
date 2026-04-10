import React from 'react'
import PageContainer from '@/components/layout/PageContainer.jsx'

/**
 * 渠道对账「完整新增 / 完整编辑」共用页架：工具区 + 表单 + 粘性底栏（预览金额 + 操作）
 */
function ChannelFormPageLayout({ toolsSlot, previewAmount, footerActions, children }) {
  return (
    <PageContainer hideHeader className="page-container--admin-workspace page-container--channel-form">
      <div className="admin-workspace rec-form-page">
        {toolsSlot ? (
          <section className="admin-workspace__card rec-form-page__tools-card">
            <h3 className="admin-workspace__card-title">工具与预设</h3>
            <p className="admin-workspace__card-desc">
              预留与研发对账一致的快速填充能力；当前可先使用表单内渠道联想与完整字段录入。
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

export default ChannelFormPageLayout
