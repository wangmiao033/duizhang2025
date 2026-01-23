import React, { useState, useEffect } from 'react'
import './TagManager.css'

function TagManager({ records, onTagChange }) {
  const [tags, setTags] = useState([])
  const [newTag, setNewTag] = useState({ name: '', color: '#4f46e5' })
  const [showAddForm, setShowAddForm] = useState(false)
  const [tagStats, setTagStats] = useState({})

  const predefinedColors = [
    '#4f46e5', '#7c3aed', '#ec4899', '#ef4444', '#f59e0b',
    '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#f97316'
  ]

  useEffect(() => {
    const savedTags = localStorage.getItem('tags')
    if (savedTags) {
      setTags(JSON.parse(savedTags))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('tags', JSON.stringify(tags))
    calculateTagStats()
  }, [tags, records])

  const calculateTagStats = () => {
    const stats = {}
    records.forEach(record => {
      if (record.tags && Array.isArray(record.tags)) {
        record.tags.forEach(tag => {
          stats[tag] = (stats[tag] || 0) + 1
        })
      }
    })
    setTagStats(stats)
  }

  const addTag = () => {
    if (!newTag.name.trim()) return
    
    const tagExists = tags.find(t => t.name.toLowerCase() === newTag.name.toLowerCase())
    if (tagExists) {
      window.alert('标签已存在')
      return
    }

    const tag = {
      id: Date.now(),
      name: newTag.name.trim(),
      color: newTag.color,
      createdAt: new Date().toISOString()
    }

    setTags([...tags, tag])
    setNewTag({ name: '', color: '#4f46e5' })
    setShowAddForm(false)
  }

  const deleteTag = (tagId) => {
    if (window.confirm('删除标签不会删除记录，只会移除标签关联。确定删除吗？')) {
      const tagToDelete = tags.find(t => t.id === tagId)
      if (tagToDelete && onTagChange) {
        // 从所有记录中移除该标签
        records.forEach(record => {
          if (record.tags && Array.isArray(record.tags) && record.tags.includes(tagToDelete.name)) {
            const updatedTags = record.tags.filter(t => t !== tagToDelete.name)
            onTagChange(record.id, { ...record, tags: updatedTags })
          }
        })
      }
      setTags(tags.filter(t => t.id !== tagId))
    }
  }

  const editTag = (tagId, updates) => {
    setTags(tags.map(t => t.id === tagId ? { ...t, ...updates } : t))
  }

  return (
    <div className="tag-manager">
      <div className="tag-manager-header">
        <h3>标签管理</h3>
        <button 
          className="add-tag-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '取消' : '+ 添加标签'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-tag-form">
          <input
            type="text"
            placeholder="标签名称"
            value={newTag.name}
            onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
            className="tag-name-input"
          />
          <div className="color-picker">
            {predefinedColors.map(color => (
              <button
                key={color}
                className={`color-option ${newTag.color === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setNewTag({ ...newTag, color })}
                title={color}
              />
            ))}
          </div>
          <button className="submit-tag-btn" onClick={addTag}>
            创建标签
          </button>
        </div>
      )}

      <div className="tags-list">
        {tags.length === 0 ? (
          <div className="empty-tags">暂无标签，点击上方按钮添加</div>
        ) : (
          tags.map(tag => (
            <div key={tag.id} className="tag-item">
              <span 
                className="tag-badge"
                style={{ 
                  backgroundColor: tag.color,
                  color: '#fff'
                }}
              >
                {tag.name}
                {tagStats[tag.name] && (
                  <span className="tag-count">({tagStats[tag.name]})</span>
                )}
              </span>
              <div className="tag-actions">
                <button
                  className="edit-tag-btn"
                  onClick={() => {
                    const newName = window.prompt('输入新名称:', tag.name)
                    if (newName && newName.trim()) {
                      editTag(tag.id, { name: newName.trim() })
                    }
                  }}
                >
                  编辑
                </button>
                <button
                  className="delete-tag-btn"
                  onClick={() => deleteTag(tag.id)}
                >
                  删除
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="tag-usage-hint">
        💡 提示：在记录编辑时可以为记录添加标签，方便分类和筛选
      </div>
    </div>
  )
}

export default TagManager
