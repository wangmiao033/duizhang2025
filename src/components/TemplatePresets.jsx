import React, { useState, useEffect } from 'react'
import './TemplatePresets.css'

function TemplatePresets({ onApplyTemplate }) {
  const [templates, setTemplates] = useState([])
  const [showDialog, setShowDialog] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateData, setTemplateData] = useState({
    channelFeeRate: '5',
    taxPoint: '0',
    revenueShareRatio: '30',
    discount: '0.005'
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = () => {
    const saved = localStorage.getItem('templatePresets')
    if (saved) {
      try {
        setTemplates(JSON.parse(saved))
      } catch (e) {
        console.error('加载模板失败', e)
      }
    } else {
      // 初始化默认模板
      const defaultTemplates = [
        {
          id: 1,
          name: '标准模板',
          channelFeeRate: '5',
          taxPoint: '0',
          revenueShareRatio: '30',
          discount: '0.005'
        },
        {
          id: 2,
          name: '高分成模板',
          channelFeeRate: '5',
          taxPoint: '0',
          revenueShareRatio: '50',
          discount: '0.005'
        },
        {
          id: 3,
          name: '低折扣模板',
          channelFeeRate: '5',
          taxPoint: '0',
          revenueShareRatio: '30',
          discount: '0.001'
        }
      ]
      setTemplates(defaultTemplates)
      localStorage.setItem('templatePresets', JSON.stringify(defaultTemplates))
    }
  }

  const saveTemplate = () => {
    if (!templateName.trim()) {
      alert('请输入模板名称！')
      return
    }

    const newTemplate = {
      id: Date.now(),
      name: templateName.trim(),
      ...templateData
    }

    const updated = [...templates, newTemplate]
    localStorage.setItem('templatePresets', JSON.stringify(updated))
    setTemplates(updated)
    setShowDialog(false)
    setTemplateName('')
    setTemplateData({
      channelFeeRate: '5',
      taxPoint: '0',
      revenueShareRatio: '30',
      discount: '0.005'
    })
  }

  const deleteTemplate = (id) => {
    if (window.confirm('确定要删除这个模板吗？')) {
      const updated = templates.filter(t => t.id !== id)
      localStorage.setItem('templatePresets', JSON.stringify(updated))
      setTemplates(updated)
    }
  }

  const applyTemplate = (template) => {
    if (onApplyTemplate) {
      onApplyTemplate(template)
    }
  }

  return (
    <div className="template-presets">
      <button 
        className="template-btn"
        onClick={() => setShowDialog(!showDialog)}
      >
        📋 模板预设
      </button>

      {showDialog && (
        <div className="template-dialog-overlay" onClick={() => setShowDialog(false)}>
          <div className="template-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="template-dialog-header">
              <h4>模板预设</h4>
              <button className="close-btn" onClick={() => setShowDialog(false)}>×</button>
            </div>

            <div className="template-list">
              {templates.map((template) => (
                <div key={template.id} className="template-item">
                  <div className="template-info">
                    <h5>{template.name}</h5>
                    <div className="template-details">
                      <span>通道费率: {template.channelFeeRate}%</span>
                      <span>税点: {template.taxPoint}%</span>
                      <span>分成: {template.revenueShareRatio}%</span>
                      <span>折扣: {template.discount}</span>
                    </div>
                  </div>
                  <div className="template-actions">
                    <button 
                      className="apply-btn"
                      onClick={() => {
                        applyTemplate(template)
                        setShowDialog(false)
                      }}
                    >
                      应用
                    </button>
                    <button 
                      className="delete-template-btn"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="template-form">
              <h5>创建新模板</h5>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="模板名称"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="template-name-input"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>通道费率(%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={templateData.channelFeeRate}
                    onChange={(e) => setTemplateData({ ...templateData, channelFeeRate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>税点(%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={templateData.taxPoint}
                    onChange={(e) => setTemplateData({ ...templateData, taxPoint: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>分成比例(%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={templateData.revenueShareRatio}
                    onChange={(e) => setTemplateData({ ...templateData, revenueShareRatio: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>折扣</label>
                  <input
                    type="number"
                    step="0.001"
                    value={templateData.discount}
                    onChange={(e) => setTemplateData({ ...templateData, discount: e.target.value })}
                  />
                </div>
              </div>
              <button className="save-template-btn" onClick={saveTemplate}>
                保存模板
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TemplatePresets

