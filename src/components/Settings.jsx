import React, { useState, useEffect } from 'react'
import './Settings.css'
import { 
  SETTLEMENT_NUMBER_FORMATS, 
  getNumberFormatFromStorage, 
  saveNumberFormatToStorage 
} from '../utils/settlementNumber.js'

function Settings({ onSettingsChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState({
    autoSave: true,
    autoCalculate: true,
    defaultChannelFeeRate: '5',
    defaultTaxPoint: '0',
    defaultRevenueShareRatio: '30',
    defaultDiscount: '0.005',
    showStatistics: true,
    showValidator: true,
    theme: 'light'
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = () => {
    const saved = localStorage.getItem('appSettings')
    if (saved) {
      try {
        const loaded = JSON.parse(saved)
        setSettings({ ...settings, ...loaded })
      } catch (e) {
        console.error('加载设置失败', e)
      }
    }
    // 加载编号格式配置
    const numberFormat = getNumberFormatFromStorage()
    setSettings(prev => ({ ...prev, settlementNumberFormat: numberFormat }))
  }

  const saveSettings = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings))
    // 保存编号格式配置
    if (settings.settlementNumberFormat) {
      saveNumberFormatToStorage(settings.settlementNumberFormat)
    }
    if (onSettingsChange) {
      onSettingsChange(settings)
    }
    setIsOpen(false)
  }

  const resetSettings = () => {
    if (window.confirm('确定要重置所有设置吗？')) {
      const defaultSettings = {
        autoSave: true,
        autoCalculate: true,
        defaultChannelFeeRate: '5',
        defaultTaxPoint: '0',
        defaultRevenueShareRatio: '30',
        defaultDiscount: '0.005',
        showStatistics: true,
        showValidator: true,
        theme: 'light'
      }
      setSettings(defaultSettings)
      localStorage.setItem('appSettings', JSON.stringify(defaultSettings))
      if (onSettingsChange) {
        onSettingsChange(defaultSettings)
      }
    }
  }

  const handleSettingChange = (key, value) => {
    setSettings({ ...settings, [key]: value })
  }

  return (
    <div className="settings">
      <button 
        className="settings-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="系统设置"
      >
        ⚙️ 设置
      </button>

      {isOpen && (
        <div className="settings-dialog-overlay" onClick={() => setIsOpen(false)}>
          <div className="settings-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <h4>系统设置</h4>
              <button className="close-settings-btn" onClick={() => setIsOpen(false)}>×</button>
            </div>

            <div className="settings-content">
              <div className="settings-section">
                <h5>默认值设置</h5>
                <div className="settings-grid">
                  <div className="setting-item">
                    <label>默认通道费率(%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.defaultChannelFeeRate}
                      onChange={(e) => handleSettingChange('defaultChannelFeeRate', e.target.value)}
                    />
                  </div>
                  <div className="setting-item">
                    <label>默认税点(%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.defaultTaxPoint}
                      onChange={(e) => handleSettingChange('defaultTaxPoint', e.target.value)}
                    />
                  </div>
                  <div className="setting-item">
                    <label>默认分成比例(%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.defaultRevenueShareRatio}
                      onChange={(e) => handleSettingChange('defaultRevenueShareRatio', e.target.value)}
                    />
                  </div>
                  <div className="setting-item">
                    <label>默认折扣</label>
                    <input
                      type="number"
                      step="0.001"
                      value={settings.defaultDiscount}
                      onChange={(e) => handleSettingChange('defaultDiscount', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h5>结算单编号格式</h5>
                <div className="setting-item">
                  <label>编号生成格式</label>
                  <select
                    value={settings.settlementNumberFormat || 'DATE_SEQUENCE'}
                    onChange={(e) => handleSettingChange('settlementNumberFormat', e.target.value)}
                    className="format-select"
                  >
                    {Object.entries(SETTLEMENT_NUMBER_FORMATS).map(([key, format]) => (
                      <option key={key} value={key}>
                        {format.name} - {format.description}
                      </option>
                    ))}
                  </select>
                  <div className="format-description">
                    {SETTLEMENT_NUMBER_FORMATS[settings.settlementNumberFormat || 'DATE_SEQUENCE']?.description}
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h5>功能设置</h5>
                <div className="settings-switches">
                  <div className="switch-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={settings.autoSave}
                        onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                      />
                      <span>自动保存数据</span>
                    </label>
                  </div>
                  <div className="switch-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={settings.autoCalculate}
                        onChange={(e) => handleSettingChange('autoCalculate', e.target.checked)}
                      />
                      <span>自动计算结算金额</span>
                    </label>
                  </div>
                  <div className="switch-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={settings.showStatistics}
                        onChange={(e) => handleSettingChange('showStatistics', e.target.checked)}
                      />
                      <span>显示统计图表</span>
                    </label>
                  </div>
                  <div className="switch-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={settings.showValidator}
                        onChange={(e) => handleSettingChange('showValidator', e.target.checked)}
                      />
                      <span>显示数据校验</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-footer">
              <button className="reset-btn" onClick={resetSettings}>
                重置设置
              </button>
              <button className="save-settings-btn" onClick={saveSettings}>
                保存设置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings

