import React, { useState, useEffect } from 'react'
import './NotificationCenter.css'

function NotificationCenter() {
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // 监听自定义通知事件
    const handleNotification = (event) => {
      const { message, type, duration } = event.detail
      addNotification(message, type, duration)
    }

    window.addEventListener('app-notification', handleNotification)
    return () => {
      window.removeEventListener('app-notification', handleNotification)
    }
  }, [])

  const addNotification = (message, type = 'info', duration = 5000) => {
    const id = Date.now()
    const notification = {
      id,
      message,
      type,
      timestamp: new Date()
    }

    setNotifications(prev => [notification, ...prev].slice(0, 10))

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const unreadCount = notifications.length

  return (
    <div className="notification-center">
      <button 
        className="notification-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="通知中心"
      >
        🔔 {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <h4>通知中心</h4>
            {notifications.length > 0 && (
              <button className="clear-all-btn" onClick={clearAll}>
                清空
              </button>
            )}
            <button className="close-notification-btn" onClick={() => setIsOpen(false)}>
              ×
            </button>
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="empty-notifications">暂无通知</div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item notification-${notification.type}`}
                >
                  <div className="notification-content">
                    <span className="notification-message">{notification.message}</span>
                    <span className="notification-time">
                      {new Date(notification.timestamp).toLocaleTimeString('zh-CN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <button 
                    className="notification-close"
                    onClick={() => removeNotification(notification.id)}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// 导出通知函数供其他组件使用
export const showNotification = (message, type = 'info', duration = 5000) => {
  const event = new CustomEvent('app-notification', {
    detail: { message, type, duration }
  })
  window.dispatchEvent(event)
}

export default NotificationCenter

