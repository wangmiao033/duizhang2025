import React, { useState, useEffect } from 'react'
import './ReminderManager.css'

function ReminderManager({ onReminderAdd }) {
  const [reminders, setReminders] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    type: 'invoice',
    isCompleted: false
  })

  const reminderTypes = {
    invoice: { label: '发票', icon: '📄', color: '#3b82f6' },
    payment: { label: '付款', icon: '💳', color: '#10b981' },
    reconciliation: { label: '对账', icon: '📊', color: '#8b5cf6' },
    other: { label: '其他', icon: '📌', color: '#64748b' }
  }

  const priorities = {
    low: { label: '低', color: '#10b981' },
    medium: { label: '中', color: '#f59e0b' },
    high: { label: '高', color: '#ef4444' }
  }

  useEffect(() => {
    const savedReminders = localStorage.getItem('reminders')
    if (savedReminders) {
      setReminders(JSON.parse(savedReminders))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('reminders', JSON.stringify(reminders))
    checkOverdueReminders()
  }, [reminders])

  const checkOverdueReminders = () => {
    const now = new Date()
    reminders.forEach(reminder => {
      if (!reminder.isCompleted && reminder.dueDate) {
        const dueDate = new Date(reminder.dueDate)
        if (dueDate < now && !reminder.isOverdue) {
          setReminders(prev => prev.map(r => 
            r.id === reminder.id ? { ...r, isOverdue: true } : r
          ))
        }
      }
    })
  }

  const addReminder = () => {
    if (!newReminder.title.trim() || !newReminder.dueDate) {
      alert('请填写标题和到期日期')
      return
    }

    const reminder = {
      id: Date.now(),
      ...newReminder,
      createdAt: new Date().toISOString()
    }

    setReminders([reminder, ...reminders])
    setNewReminder({
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      type: 'invoice',
      isCompleted: false
    })
    setShowAddForm(false)
    
    if (onReminderAdd) {
      onReminderAdd(reminder)
    }
  }

  const toggleComplete = (id) => {
    setReminders(reminders.map(r => 
      r.id === id ? { ...r, isCompleted: !r.isCompleted } : r
    ))
  }

  const deleteReminder = (id) => {
    if (confirm('确定删除这个提醒吗？')) {
      setReminders(reminders.filter(r => r.id !== id))
    }
  }

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null
    const now = new Date()
    const due = new Date(dueDate)
    const diffTime = due - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const filteredReminders = reminders.filter(r => !r.isCompleted)
  const completedReminders = reminders.filter(r => r.isCompleted)

  return (
    <div className="reminder-manager">
      <div className="reminder-header">
        <h3>提醒事项</h3>
        <button 
          className="add-reminder-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '取消' : '+ 添加提醒'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-reminder-form">
          <input
            type="text"
            placeholder="提醒标题 *"
            value={newReminder.title}
            onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
            className="reminder-input"
          />
          <textarea
            placeholder="描述（可选）"
            value={newReminder.description}
            onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
            className="reminder-textarea"
            rows="3"
          />
          <div className="reminder-options">
            <div className="option-group">
              <label>到期日期 *</label>
              <input
                type="date"
                value={newReminder.dueDate}
                onChange={(e) => setNewReminder({ ...newReminder, dueDate: e.target.value })}
                className="reminder-date-input"
              />
            </div>
            <div className="option-group">
              <label>类型</label>
              <select
                value={newReminder.type}
                onChange={(e) => setNewReminder({ ...newReminder, type: e.target.value })}
                className="reminder-select"
              >
                {Object.entries(reminderTypes).map(([key, value]) => (
                  <option key={key} value={key}>{value.icon} {value.label}</option>
                ))}
              </select>
            </div>
            <div className="option-group">
              <label>优先级</label>
              <select
                value={newReminder.priority}
                onChange={(e) => setNewReminder({ ...newReminder, priority: e.target.value })}
                className="reminder-select"
              >
                {Object.entries(priorities).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
            </div>
          </div>
          <button className="submit-reminder-btn" onClick={addReminder}>
            创建提醒
          </button>
        </div>
      )}

      <div className="reminders-list">
        {filteredReminders.length === 0 && completedReminders.length === 0 ? (
          <div className="empty-reminders">暂无提醒事项</div>
        ) : (
          <>
            {filteredReminders.length > 0 && (
              <div className="reminders-section">
                <h4>待办事项 ({filteredReminders.length})</h4>
                {filteredReminders.map(reminder => {
                  const daysUntil = getDaysUntilDue(reminder.dueDate)
                  const typeInfo = reminderTypes[reminder.type] || reminderTypes.other
                  const priorityInfo = priorities[reminder.priority] || priorities.medium
                  
                  return (
                    <div 
                      key={reminder.id} 
                      className={`reminder-item ${reminder.isOverdue ? 'overdue' : ''} priority-${reminder.priority}`}
                    >
                      <div className="reminder-content">
                        <div className="reminder-main">
                          <span className="reminder-type-icon" style={{ color: typeInfo.color }}>
                            {typeInfo.icon}
                          </span>
                          <div className="reminder-info">
                            <div className="reminder-title">{reminder.title}</div>
                            {reminder.description && (
                              <div className="reminder-description">{reminder.description}</div>
                            )}
                            <div className="reminder-meta">
                              <span className="reminder-date">
                                📅 {new Date(reminder.dueDate).toLocaleDateString('zh-CN')}
                              </span>
                              {daysUntil !== null && (
                                <span className={`days-badge ${daysUntil < 0 ? 'overdue' : daysUntil <= 3 ? 'urgent' : ''}`}>
                                  {daysUntil < 0 ? `已逾期 ${Math.abs(daysUntil)} 天` : 
                                   daysUntil === 0 ? '今天到期' : 
                                   daysUntil === 1 ? '明天到期' : 
                                   `还有 ${daysUntil} 天`}
                                </span>
                              )}
                              <span 
                                className="priority-badge"
                                style={{ backgroundColor: priorityInfo.color }}
                              >
                                {priorityInfo.label}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="reminder-actions">
                          <button
                            className="complete-btn"
                            onClick={() => toggleComplete(reminder.id)}
                            title="标记为完成"
                          >
                            ✓
                          </button>
                          <button
                            className="delete-reminder-btn"
                            onClick={() => deleteReminder(reminder.id)}
                            title="删除"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {completedReminders.length > 0 && (
              <div className="reminders-section completed">
                <h4>已完成 ({completedReminders.length})</h4>
                {completedReminders.map(reminder => (
                  <div key={reminder.id} className="reminder-item completed">
                    <div className="reminder-content">
                      <div className="reminder-main">
                        <span className="reminder-type-icon">
                          {reminderTypes[reminder.type]?.icon || '📌'}
                        </span>
                        <div className="reminder-info">
                          <div className="reminder-title completed">{reminder.title}</div>
                          <div className="reminder-meta">
                            <span className="reminder-date">
                              📅 {new Date(reminder.dueDate).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="reminder-actions">
                        <button
                          className="undo-btn"
                          onClick={() => toggleComplete(reminder.id)}
                          title="恢复"
                        >
                          ↺
                        </button>
                        <button
                          className="delete-reminder-btn"
                          onClick={() => deleteReminder(reminder.id)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ReminderManager
