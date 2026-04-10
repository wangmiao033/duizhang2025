import React from 'react'
import PageContainer from '@/components/layout/PageContainer.jsx'
import ReminderManager from '@/components/ReminderManager.jsx'
import { useAppState } from '@/app/AppStateContext.jsx'

function RemindersPage() {
  const { showToast } = useAppState()

  return (
    <PageContainer title="提醒事项" description="非主导航入口，可从工作台快捷操作打开">
      <ReminderManager
        onReminderAdd={(reminder) => {
          showToast(`提醒"${reminder.title}"已添加`, 'success')
        }}
      />
    </PageContainer>
  )
}

export default RemindersPage
