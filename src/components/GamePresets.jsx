import React, { useState, useEffect } from 'react'
import './GamePresets.css'

function GamePresets({ onApplyPreset, currentGameName }) {
  const [presets, setPresets] = useState([])
  const [showDialog, setShowDialog] = useState(false)
  const [editingPreset, setEditingPreset] = useState(null)
  const [presetForm, setPresetForm] = useState({
    gameName: '',
    gameNamePattern: '', // 游戏名称匹配模式（支持部分匹配）
    channelFeeRate: '0',
    taxPoint: '0',
    revenueShareRatio: '15',
    discount: '1', // 默认1（无折扣），0.05折=0.0005, 0.01折=0.0001
    testingFee: '0',
    description: ''
  })

  useEffect(() => {
    loadPresets()
  }, [])

  // 当游戏名称变化时，尝试自动匹配预设
  useEffect(() => {
    if (currentGameName && presets.length > 0) {
      const matched = findMatchingPreset(currentGameName)
      if (matched && onApplyPreset) {
        // 自动应用匹配的预设（可选，或者只是提示）
        // onApplyPreset(matched)
      }
    }
  }, [currentGameName, presets, onApplyPreset])

  const loadPresets = () => {
    const saved = localStorage.getItem('gamePresets')
    if (saved) {
      try {
        const loaded = JSON.parse(saved)
        setPresets(loaded)
      } catch (e) {
        console.error('加载游戏预设失败', e)
        initDefaultPresets()
      }
    } else {
      initDefaultPresets()
    }
  }

  const initDefaultPresets = () => {
    // 根据图片中的对账单，创建默认预设
    const defaultPresets = [
      {
        id: 1,
        gameName: '龙吟大陆',
        gameNamePattern: '龙吟',
        channelFeeRate: '0',
        taxPoint: '0',
        revenueShareRatio: '15',
        discount: '1', // 无折扣
        testingFee: '0',
        description: '龙吟大陆标准配置'
      },
      {
        id: 2,
        gameName: '0.05折游戏',
        gameNamePattern: '0.05',
        channelFeeRate: '0',
        taxPoint: '0',
        revenueShareRatio: '30',
        discount: '0.0005', // 0.05折
        testingFee: '0',
        description: '0.05折游戏预设'
      },
      {
        id: 3,
        gameName: '0.01折游戏',
        gameNamePattern: '0.01',
        channelFeeRate: '0',
        taxPoint: '0',
        revenueShareRatio: '30',
        discount: '0.0001', // 0.01折
        testingFee: '0',
        description: '0.01折游戏预设'
      }
    ]
    setPresets(defaultPresets)
    localStorage.setItem('gamePresets', JSON.stringify(defaultPresets))
  }

  const findMatchingPreset = (gameName) => {
    if (!gameName) return null
    
    // 精确匹配
    let matched = presets.find(p => 
      p.gameName.toLowerCase() === gameName.toLowerCase()
    )
    
    // 模式匹配（游戏名称包含模式）
    if (!matched) {
      matched = presets.find(p => 
        p.gameNamePattern && 
        gameName.toLowerCase().includes(p.gameNamePattern.toLowerCase())
      )
    }
    
    return matched
  }

  const savePreset = () => {
    if (!presetForm.gameName.trim()) {
      alert('请输入游戏名称！')
      return
    }

    const presetData = {
      id: editingPreset ? editingPreset.id : Date.now(),
      gameName: presetForm.gameName.trim(),
      gameNamePattern: presetForm.gameNamePattern.trim() || presetForm.gameName.trim(),
      channelFeeRate: presetForm.channelFeeRate || '0',
      taxPoint: presetForm.taxPoint || '0',
      revenueShareRatio: presetForm.revenueShareRatio || '15',
      discount: presetForm.discount || '1',
      testingFee: presetForm.testingFee || '0',
      description: presetForm.description.trim()
    }

    let updated
    if (editingPreset) {
      updated = presets.map(p => p.id === editingPreset.id ? presetData : p)
    } else {
      updated = [...presets, presetData]
    }

    localStorage.setItem('gamePresets', JSON.stringify(updated))
    setPresets(updated)
    resetForm()
    setShowDialog(false)
  }

  const deletePreset = (id) => {
    if (window.confirm('确定要删除这个游戏预设吗？')) {
      const updated = presets.filter(p => p.id !== id)
      localStorage.setItem('gamePresets', JSON.stringify(updated))
      setPresets(updated)
    }
  }

  const editPreset = (preset) => {
    setEditingPreset(preset)
    setPresetForm({
      gameName: preset.gameName,
      gameNamePattern: preset.gameNamePattern || preset.gameName,
      channelFeeRate: preset.channelFeeRate || '0',
      taxPoint: preset.taxPoint || '0',
      revenueShareRatio: preset.revenueShareRatio || '15',
      discount: preset.discount || '1',
      testingFee: preset.testingFee || '0',
      description: preset.description || ''
    })
    setShowDialog(true)
  }

  const applyPreset = (preset) => {
    if (onApplyPreset) {
      onApplyPreset({
        channelFeeRate: preset.channelFeeRate,
        taxPoint: preset.taxPoint,
        revenueShareRatio: preset.revenueShareRatio,
        discount: preset.discount,
        testingFee: preset.testingFee
      })
    }
    setShowDialog(false)
  }

  const resetForm = () => {
    setEditingPreset(null)
    setPresetForm({
      gameName: '',
      gameNamePattern: '',
      channelFeeRate: '0',
      taxPoint: '0',
      revenueShareRatio: '15',
      discount: '1',
      testingFee: '0',
      description: ''
    })
  }

  const getDiscountDisplay = (discount) => {
    const d = parseFloat(discount)
    if (d === 1) return '无折扣'
    if (d === 0.0005) return '0.05折'
    if (d === 0.0001) return '0.01折'
    return `${(d * 100).toFixed(3)}折`
  }

  return (
    <div className="game-presets">
      <button 
        className="game-presets-btn"
        onClick={() => {
          resetForm()
          setShowDialog(true)
        }}
        title="游戏预设管理"
      >
        🎮 游戏预设
      </button>

      {showDialog && (
        <div className="game-presets-dialog-overlay" onClick={() => {
          setShowDialog(false)
          resetForm()
        }}>
          <div className="game-presets-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="game-presets-header">
              <h4>游戏预设管理</h4>
              <button className="close-btn" onClick={() => {
                setShowDialog(false)
                resetForm()
              }}>×</button>
            </div>

            <div className="game-presets-content">
              <div className="presets-list-section">
                <h5>已有预设 ({presets.length})</h5>
                <div className="presets-list">
                  {presets.length === 0 ? (
                    <div className="empty-presets">暂无预设，请创建</div>
                  ) : (
                    presets.map((preset) => (
                      <div key={preset.id} className="preset-item">
                        <div className="preset-info">
                          <div className="preset-name-row">
                            <strong>{preset.gameName}</strong>
                            {preset.gameNamePattern && preset.gameNamePattern !== preset.gameName && (
                              <span className="pattern-hint">匹配: {preset.gameNamePattern}</span>
                            )}
                          </div>
                          <div className="preset-details">
                            <span>通道费率: {preset.channelFeeRate}%</span>
                            <span>税点: {preset.taxPoint}%</span>
                            <span>分成: {preset.revenueShareRatio}%</span>
                            <span className="discount-badge">折扣: {getDiscountDisplay(preset.discount)}</span>
                          </div>
                          {preset.description && (
                            <div className="preset-description">{preset.description}</div>
                          )}
                        </div>
                        <div className="preset-actions">
                          <button 
                            className="apply-preset-btn"
                            onClick={() => applyPreset(preset)}
                            title="应用此预设"
                          >
                            应用
                          </button>
                          <button 
                            className="edit-preset-btn"
                            onClick={() => editPreset(preset)}
                            title="编辑预设"
                          >
                            编辑
                          </button>
                          <button 
                            className="delete-preset-btn"
                            onClick={() => deletePreset(preset.id)}
                            title="删除预设"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="preset-form-section">
                <h5>{editingPreset ? '编辑预设' : '创建新预设'}</h5>
                <div className="preset-form">
                  <div className="form-group">
                    <label>游戏名称 *</label>
                    <input
                      type="text"
                      value={presetForm.gameName}
                      onChange={(e) => setPresetForm({ ...presetForm, gameName: e.target.value })}
                      placeholder="如：龙吟大陆"
                    />
                  </div>
                  <div className="form-group">
                    <label>匹配模式（可选）</label>
                    <input
                      type="text"
                      value={presetForm.gameNamePattern}
                      onChange={(e) => setPresetForm({ ...presetForm, gameNamePattern: e.target.value })}
                      placeholder="游戏名称包含此文本时自动匹配，留空则使用游戏名称"
                    />
                    <small>例如：输入"龙吟"，则包含"龙吟"的游戏名都会匹配</small>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>通道费率(%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={presetForm.channelFeeRate}
                        onChange={(e) => setPresetForm({ ...presetForm, channelFeeRate: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>税点(%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={presetForm.taxPoint}
                        onChange={(e) => setPresetForm({ ...presetForm, taxPoint: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>分成比例(%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={presetForm.revenueShareRatio}
                        onChange={(e) => setPresetForm({ ...presetForm, revenueShareRatio: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>折扣 *</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={presetForm.discount}
                        onChange={(e) => setPresetForm({ ...presetForm, discount: e.target.value })}
                        placeholder="1=无折扣, 0.0005=0.05折, 0.0001=0.01折"
                      />
                      <small>
                        当前: {getDiscountDisplay(presetForm.discount)}
                      </small>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>测试费(元)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={presetForm.testingFee}
                      onChange={(e) => setPresetForm({ ...presetForm, testingFee: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>备注说明</label>
                    <input
                      type="text"
                      value={presetForm.description}
                      onChange={(e) => setPresetForm({ ...presetForm, description: e.target.value })}
                      placeholder="可选：添加说明"
                    />
                  </div>
                  <div className="preset-form-actions">
                    <button className="save-preset-btn" onClick={savePreset}>
                      {editingPreset ? '更新预设' : '保存预设'}
                    </button>
                    {editingPreset && (
                      <button className="cancel-edit-btn" onClick={resetForm}>
                        取消编辑
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 导出查找预设的函数，供外部使用
export function findGamePreset(gameName) {
  if (!gameName || !gameName.trim()) return null
  
  // 从localStorage加载预设
  const saved = localStorage.getItem('gamePresets')
  if (!saved) return null
  
  try {
    const allPresets = JSON.parse(saved)
    if (!allPresets || allPresets.length === 0) return null
    
    const gameNameLower = gameName.toLowerCase().trim()
    
    // 精确匹配
    let matched = allPresets.find(p => 
      p.gameName && p.gameName.toLowerCase() === gameNameLower
    )
    
    // 模式匹配（游戏名称包含模式）
    if (!matched) {
      matched = allPresets.find(p => {
        if (!p.gameNamePattern) return false
        const pattern = p.gameNamePattern.toLowerCase().trim()
        return gameNameLower.includes(pattern) || pattern.includes(gameNameLower)
      })
    }
    
    return matched || null
  } catch (e) {
    console.error('查找游戏预设失败:', e)
    return null
  }
}

export default GamePresets
