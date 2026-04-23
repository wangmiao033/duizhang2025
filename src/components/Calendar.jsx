import React, { useState, useEffect, useMemo, useRef } from 'react'
import dayjs from 'dayjs'
import './Calendar.css'

// 免费节假日 API: https://timor.tech/api/holiday
// 备用方案：使用本地节假日数据

function Calendar({ onDateSelect, reminders = [], compact = false }) {
  const [currentDate, setCurrentDate] = useState(dayjs())
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [holidays, setHolidays] = useState({})
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // 获取节假日数据
  useEffect(() => {
    const fetchHolidays = async () => {
      const year = currentDate.year()
      const month = currentDate.month() + 1
      
      // 检查缓存
      const cacheKey = `holidays_${year}_${month}`
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          setHolidays(prev => ({ ...prev, ...JSON.parse(cached) }))
          return
        } catch (e) {
          // 缓存解析失败，继续请求
        }
      }

      setLoading(true)
      try {
        // 使用 timor.tech 免费 API
        const response = await fetch(
          `https://timor.tech/api/holiday/year/${year}`,
          { mode: 'cors' }
        )
        if (response.ok) {
          const data = await response.json()
          if (data.code === 0 && data.holiday) {
            const holidayMap = {}
            Object.entries(data.holiday).forEach(([date, info]) => {
              holidayMap[date] = {
                name: info.name,
                isHoliday: info.holiday,
                wage: info.wage
              }
            })
            setHolidays(holidayMap)
            localStorage.setItem(cacheKey, JSON.stringify(holidayMap))
          }
        }
      } catch (error) {
        console.log('节假日 API 请求失败，使用本地数据')
        // 使用本地备用数据
        setHolidays(getLocalHolidays(year))
      } finally {
        setLoading(false)
      }
    }

    fetchHolidays()
  }, [currentDate.year()])

  // 本地备用节假日数据
  const getLocalHolidays = (year) => {
    return {
      [`${year}-01-01`]: { name: '元旦', isHoliday: true },
      [`${year}-02-10`]: { name: '春节', isHoliday: true },
      [`${year}-02-11`]: { name: '春节', isHoliday: true },
      [`${year}-02-12`]: { name: '春节', isHoliday: true },
      [`${year}-04-04`]: { name: '清明节', isHoliday: true },
      [`${year}-05-01`]: { name: '劳动节', isHoliday: true },
      [`${year}-06-10`]: { name: '端午节', isHoliday: true },
      [`${year}-09-17`]: { name: '中秋节', isHoliday: true },
      [`${year}-10-01`]: { name: '国庆节', isHoliday: true },
      [`${year}-10-02`]: { name: '国庆节', isHoliday: true },
      [`${year}-10-03`]: { name: '国庆节', isHoliday: true },
    }
  }

  // 生成日历数据
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = currentDate.startOf('month')
    const lastDayOfMonth = currentDate.endOf('month')
    const startDay = firstDayOfMonth.day() // 0-6
    const daysInMonth = lastDayOfMonth.date()
    
    const days = []
    
    // 上个月的天数
    const prevMonth = currentDate.subtract(1, 'month')
    const daysInPrevMonth = prevMonth.endOf('month').date()
    for (let i = startDay - 1; i >= 0; i--) {
      const date = prevMonth.date(daysInPrevMonth - i)
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.isSame(dayjs(), 'day'),
        dateStr: date.format('YYYY-MM-DD')
      })
    }
    
    // 当月天数
    for (let i = 1; i <= daysInMonth; i++) {
      const date = currentDate.date(i)
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.isSame(dayjs(), 'day'),
        dateStr: date.format('YYYY-MM-DD')
      })
    }
    
    // 下个月的天数（补齐到42天，6行）
    const remaining = 42 - days.length
    const nextMonth = currentDate.add(1, 'month')
    for (let i = 1; i <= remaining; i++) {
      const date = nextMonth.date(i)
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.isSame(dayjs(), 'day'),
        dateStr: date.format('YYYY-MM-DD')
      })
    }
    
    return days
  }, [currentDate])

  // 获取某天的提醒
  const getRemindersForDate = (dateStr) => {
    return reminders.filter(r => r.dueDate === dateStr && !r.isCompleted)
  }

  const handlePrevMonth = () => {
    setCurrentDate(currentDate.subtract(1, 'month'))
  }

  const handleNextMonth = () => {
    setCurrentDate(currentDate.add(1, 'month'))
  }

  const handleToday = () => {
    setCurrentDate(dayjs())
    setSelectedDate(dayjs())
  }

  const handleDateClick = (day) => {
    setSelectedDate(day.date)
    if (onDateSelect) {
      onDateSelect(day.date, day.dateStr)
    }
  }

  const getHolidayInfo = (dateStr) => {
    // 检查完整日期
    if (holidays[dateStr]) {
      return holidays[dateStr]
    }
    // 检查不带年份的日期（如 01-01）
    const monthDay = dateStr.slice(5)
    const yearDate = `${currentDate.year()}-${monthDay}`
    return holidays[yearDate]
  }

  const todayHoliday = getHolidayInfo(dayjs().format('YYYY-MM-DD'))

  // 紧凑模式：显示日期按钮 + 下拉日历
  if (compact) {
    return (
      <div className="calendar-compact" ref={containerRef}>
        <button 
          className="calendar-trigger"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="trigger-icon">📅</span>
          <span className="trigger-date-text">{dayjs().format('YYYY-MM-DD')}</span>
          <span className="trigger-weekday">{dayjs().format('ddd')}</span>
          {todayHoliday && (
            <span className={`trigger-badge ${todayHoliday.isHoliday ? 'rest' : 'work'}`}>
              {todayHoliday.isHoliday ? '休' : '班'}
            </span>
          )}
        </button>
        
        {isOpen && (
          <div className="calendar-dropdown">
            <div className="calendar-widget">
              <div className="calendar-header">
                <button className="nav-btn" onClick={handlePrevMonth}>‹</button>
                <div className="calendar-title">
                  <span className="year">{currentDate.year()}</span>
                  <span className="month">{currentDate.month() + 1}月</span>
                </div>
                <button className="nav-btn" onClick={handleNextMonth}>›</button>
                <button className="today-btn" onClick={handleToday}>今天</button>
              </div>

              <div className="calendar-weekdays">
                {weekDays.map((day, idx) => (
                  <div key={day} className={`weekday ${idx === 0 || idx === 6 ? 'weekend' : ''}`}>
                    {day}
                  </div>
                ))}
              </div>

              <div className="calendar-days">
                {calendarDays.map((day, idx) => {
                  const holidayInfo = getHolidayInfo(day.dateStr)
                  const dayReminders = getRemindersForDate(day.dateStr)
                  const isWeekend = day.date.day() === 0 || day.date.day() === 6
                  const isSelected = day.date.isSame(selectedDate, 'day')

                  return (
                    <div
                      key={idx}
                      className={`calendar-day 
                        ${!day.isCurrentMonth ? 'other-month' : ''} 
                        ${day.isToday ? 'today' : ''} 
                        ${isSelected ? 'selected' : ''}
                        ${isWeekend ? 'weekend' : ''}
                        ${holidayInfo?.isHoliday ? 'holiday' : ''}
                        ${holidayInfo && !holidayInfo.isHoliday ? 'workday' : ''}
                      `}
                      onClick={() => handleDateClick(day)}
                      title={holidayInfo?.name || ''}
                    >
                      <span className="day-number">{day.date.date()}</span>
                      {holidayInfo && (
                        <span className={`holiday-badge ${holidayInfo.isHoliday ? 'rest' : 'work'}`}>
                          {holidayInfo.isHoliday ? '休' : '班'}
                        </span>
                      )}
                      {dayReminders.length > 0 && (
                        <span className="reminder-dot" title={`${dayReminders.length}个提醒`}>
                          {dayReminders.length}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="calendar-footer">
                <div className="calendar-legend">
                  <span className="legend-item"><span className="dot today-dot"></span>今天</span>
                  <span className="legend-item"><span className="dot holiday-dot"></span>节假日</span>
                  <span className="legend-item"><span className="dot workday-dot"></span>调休</span>
                </div>
                {loading && <span className="loading-text">加载中...</span>}
              </div>

              {selectedDate && (
                <div className="selected-info">
                  <div className="selected-date">
                    {selectedDate.format('YYYY年MM月DD日')} {selectedDate.format('dddd')}
                  </div>
                  {getHolidayInfo(selectedDate.format('YYYY-MM-DD'))?.name && (
                    <div className="holiday-name">
                      🎉 {getHolidayInfo(selectedDate.format('YYYY-MM-DD')).name}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // 完整模式
  return (
    <div className="calendar-widget">
      <div className="calendar-header">
        <button className="nav-btn" onClick={handlePrevMonth}>‹</button>
        <div className="calendar-title">
          <span className="year">{currentDate.year()}</span>
          <span className="month">{currentDate.month() + 1}月</span>
        </div>
        <button className="nav-btn" onClick={handleNextMonth}>›</button>
        <button className="today-btn" onClick={handleToday}>今天</button>
      </div>

      <div className="calendar-weekdays">
        {weekDays.map((day, idx) => (
          <div key={day} className={`weekday ${idx === 0 || idx === 6 ? 'weekend' : ''}`}>
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-days">
        {calendarDays.map((day, idx) => {
          const holidayInfo = getHolidayInfo(day.dateStr)
          const dayReminders = getRemindersForDate(day.dateStr)
          const isWeekend = day.date.day() === 0 || day.date.day() === 6
          const isSelected = day.date.isSame(selectedDate, 'day')

          return (
            <div
              key={idx}
              className={`calendar-day 
                ${!day.isCurrentMonth ? 'other-month' : ''} 
                ${day.isToday ? 'today' : ''} 
                ${isSelected ? 'selected' : ''}
                ${isWeekend ? 'weekend' : ''}
                ${holidayInfo?.isHoliday ? 'holiday' : ''}
                ${holidayInfo && !holidayInfo.isHoliday ? 'workday' : ''}
              `}
              onClick={() => handleDateClick(day)}
              title={holidayInfo?.name || ''}
            >
              <span className="day-number">{day.date.date()}</span>
              {holidayInfo && (
                <span className={`holiday-badge ${holidayInfo.isHoliday ? 'rest' : 'work'}`}>
                  {holidayInfo.isHoliday ? '休' : '班'}
                </span>
              )}
              {dayReminders.length > 0 && (
                <span className="reminder-dot" title={`${dayReminders.length}个提醒`}>
                  {dayReminders.length}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="calendar-footer">
        <div className="calendar-legend">
          <span className="legend-item"><span className="dot today-dot"></span>今天</span>
          <span className="legend-item"><span className="dot holiday-dot"></span>节假日</span>
          <span className="legend-item"><span className="dot workday-dot"></span>调休</span>
        </div>
        {loading && <span className="loading-text">加载中...</span>}
      </div>

      {selectedDate && (
        <div className="selected-info">
          <div className="selected-date">
            {selectedDate.format('YYYY年MM月DD日')} {selectedDate.format('dddd')}
          </div>
          {getHolidayInfo(selectedDate.format('YYYY-MM-DD'))?.name && (
            <div className="holiday-name">
              🎉 {getHolidayInfo(selectedDate.format('YYYY-MM-DD')).name}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Calendar
