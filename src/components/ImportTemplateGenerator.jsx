import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import './ImportTemplateGenerator.css'

function ImportTemplateGenerator({ onTemplateGenerated }) {
  const [templateType, setTemplateType] = useState('reconciliation')
  const [includeSampleData, setIncludeSampleData] = useState(true)

  const templateTypes = {
    reconciliation: {
      label: '对账记录',
      columns: [
        '游戏名称', '合作方', '结算月份', '游戏流水', '测试费', '代金券',
        '通道费率(%)', '税点(%)', '分成比例(%)', '折扣', '退款', '结算金额'
      ],
      sampleData: [
        ['示例游戏1', '示例合作方A', '2025年1月', 100000, 1000, 500, 2.5, 6, 50, 1, 0, 0],
        ['示例游戏2', '示例合作方B', '2025年1月', 200000, 2000, 1000, 3, 6, 60, 0.95, 500, 0]
      ]
    },
    invoice: {
      label: '发票记录',
      columns: ['抬头', '税号', '金额', '状态', '开票日期', '备注'],
      sampleData: [
        ['示例公司A', '91110000MA12345678', 50000, '未开', '2025-01-15', '备注信息1'],
        ['示例公司B', '91110000MA87654321', 30000, '已开', '2025-01-20', '备注信息2']
      ]
    },
    partner: {
      label: '客户信息',
      columns: ['客户名称', '类别', '标签2', '创建日期'],
      sampleData: [
        ['示例客户A', '游戏研发商', '标签A', '2025-01-01'],
        ['示例客户B', '渠道商', '标签B', '2025-01-02']
      ]
    },
    delivery: {
      label: '快递记录',
      columns: ['快递单号', '收件人', '快递公司', '寄出日期', '状态', '备注'],
      sampleData: [
        ['SF1234567890', '张三', '顺丰', '2025-01-10', '已签收', '发票'],
        ['YT9876543210', '李四', '圆通', '2025-01-15', '运输中', '合同']
      ]
    }
  }

  const generateTemplate = () => {
    const template = templateTypes[templateType]
    const workbook = XLSX.utils.book_new()
    
    const data = includeSampleData 
      ? [template.columns, ...template.sampleData]
      : [template.columns]
    
    const worksheet = XLSX.utils.aoa_to_sheet(data)
    
    // 设置列宽
    const colWidths = template.columns.map(() => ({ wch: 15 }))
    worksheet['!cols'] = colWidths
    
    // 设置第一行样式（标题行）
    const range = XLSX.utils.decode_range(worksheet['!ref'])
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
      if (!worksheet[cellAddress]) continue
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4F46E5' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      }
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, template.label)
    
    // 生成文件名
    const fileName = `${template.label}_导入模板_${new Date().toISOString().split('T')[0]}.xlsx`
    
    // 导出文件
    XLSX.writeFile(workbook, fileName)
    
    if (onTemplateGenerated) {
      onTemplateGenerated(templateType, fileName)
    }
  }

  const downloadCSVTemplate = () => {
    const template = templateTypes[templateType]
    const data = includeSampleData 
      ? [template.columns, ...template.sampleData]
      : [template.columns]
    
    const csv = data.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')
    
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.label}_导入模板_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="import-template-generator">
      <div className="template-header">
        <h3>📥 导入模板生成器</h3>
        <p className="template-description">生成标准格式的导入模板，方便批量导入数据</p>
      </div>

      <div className="template-options">
        <div className="option-group">
          <label>选择模板类型</label>
          <select
            value={templateType}
            onChange={(e) => setTemplateType(e.target.value)}
            className="template-select"
          >
            {Object.entries(templateTypes).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
        </div>

        <div className="option-group">
          <label>
            <input
              type="checkbox"
              checked={includeSampleData}
              onChange={(e) => setIncludeSampleData(e.target.checked)}
            />
            包含示例数据
          </label>
        </div>
      </div>

      <div className="template-preview">
        <h4>模板预览</h4>
        <div className="preview-table">
          <table>
            <thead>
              <tr>
                {templateTypes[templateType].columns.map((col, idx) => (
                  <th key={idx}>{col}</th>
                ))}
              </tr>
            </thead>
            {includeSampleData && (
              <tbody>
                {templateTypes[templateType].sampleData.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      </div>

      <div className="template-actions">
        <button 
          className="generate-excel-btn"
          onClick={generateTemplate}
        >
          📊 生成 Excel 模板
        </button>
        <button 
          className="generate-csv-btn"
          onClick={downloadCSVTemplate}
        >
          📄 生成 CSV 模板
        </button>
      </div>

      <div className="template-tips">
        <h4>💡 使用提示</h4>
        <ul>
          <li>下载模板后，按照模板格式填写数据</li>
          <li>第一行为列标题，请勿修改</li>
          <li>日期格式：YYYY-MM-DD（如：2025-01-15）</li>
          <li>金额字段请填写数字，不要包含货币符号</li>
          <li>百分比字段填写数字即可（如：6 表示 6%）</li>
          <li>填写完成后，使用导入功能上传文件</li>
        </ul>
      </div>
    </div>
  )
}

export default ImportTemplateGenerator
