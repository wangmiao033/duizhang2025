import React, { useRef } from 'react'
import * as XLSX from 'xlsx'
import './ExcelImport.css'

function ExcelImport({ onImport }) {
  const fileInputRef = useRef(null)

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // 读取第一个工作表
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // 转换为JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        // 解析数据
        const { records, errors, warnings } = parseExcelData(jsonData)
        
        if (records.length > 0 && onImport) {
          onImport(records)
          
          // 显示导入结果提示
          let message = `成功导入 ${records.length} 条记录`
          if (warnings.length > 0) {
            message += `\n警告：${warnings.length} 条记录存在数据问题`
          }
          if (errors.length > 0) {
            message += `\n错误：${errors.length} 条记录无法导入`
          }
          alert(message)
        } else {
          let errorMsg = '未能从Excel文件中解析到有效数据！\n\n'
          if (errors.length > 0) {
            errorMsg += `错误详情：\n${errors.slice(0, 3).join('\n')}`
            if (errors.length > 3) errorMsg += `\n...还有 ${errors.length - 3} 个错误`
          } else {
            errorMsg += '请检查文件格式，确保包含表头：结算月份、游戏、游戏流水等'
          }
          alert(errorMsg)
        }
      } catch (error) {
        console.error('导入失败:', error)
        alert(`文件格式错误：${error.message}\n\n请选择正确的Excel文件（.xlsx 或 .xls格式）`)
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = '' // 重置文件输入
  }

  const parseExcelData = (jsonData) => {
    const records = []
    const errors = []
    const warnings = []

    if (jsonData.length < 2) {
      errors.push('文件数据行数不足，至少需要表头和数据行')
      return { records, errors, warnings }
    }

    // 查找表头行
    let headerRowIndex = -1
    const headers = ['结算月份', '合作方', '游戏', '游戏流水', '测试费', '代金券', '通道费率', '税点', '分成比例', '折扣', '退款', '结算金额']
    
    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
      const row = jsonData[i] || []
      const rowStr = row.join('').toLowerCase()
      if (rowStr.includes('结算月份') || rowStr.includes('游戏')) {
        headerRowIndex = i
        break
      }
    }

    if (headerRowIndex === -1) {
      errors.push('未找到表头行，请确保Excel包含"结算月份"或"游戏"列')
      return { records, errors, warnings }
    }

    const headerRow = jsonData[headerRowIndex] || []
    
    // 创建字段映射
    const fieldMap = {}
    headers.forEach(header => {
      const index = headerRow.findIndex(h => 
        h && (h.toString().includes(header) || header.includes(h.toString()))
      )
      if (index !== -1) {
        fieldMap[header] = index
      }
    })

    // 检查必需字段
    if (!fieldMap['游戏'] && !fieldMap['游戏流水']) {
      errors.push('缺少必需字段：游戏 或 游戏流水')
      return { records, errors, warnings }
    }

    // 解析数据行
    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i] || []
      if (row.length === 0 || !row[0]) continue // 跳过空行

      const gameFlow = parseFloat(row[fieldMap['游戏流水']]) || 0
      const game = (row[fieldMap['游戏']] || '').toString().trim()

      // 验证必需字段
      if (!game && gameFlow <= 0) {
        errors.push(`第 ${i + 1} 行：缺少游戏名称且游戏流水无效`)
        continue
      }

      const record = {
        id: Date.now() + i,
        settlementMonth: (row[fieldMap['结算月份']] || '').toString().trim(),
        partner: (row[fieldMap['合作方']] || '').toString().trim(),
        game: game,
        gameFlow: gameFlow,
        testingFee: parseFloat(row[fieldMap['测试费']]) || 0,
        voucher: parseFloat(row[fieldMap['代金券']]) || 0,
        channelFeeRate: parseFloat(row[fieldMap['通道费率']]) || 5,
        taxPoint: parseFloat(row[fieldMap['税点']]) || 0,
        revenueShareRatio: parseFloat(row[fieldMap['分成比例']]) || 30,
        discount: parseFloat(row[fieldMap['折扣']]) || 0.005,
        refund: parseFloat(row[fieldMap['退款']]) || 0,
        settlementAmount: parseFloat(row[fieldMap['结算金额']]) || 0
      }

      // 数据合理性检查
      if (record.testingFee < 0 || record.voucher < 0 || record.refund < 0) {
        warnings.push(`第 ${i + 1} 行：费用或退款为负数`)
      }
      if (record.channelFeeRate < 0 || record.channelFeeRate > 100) {
        warnings.push(`第 ${i + 1} 行：通道费率超出范围(0-100%)`)
      }
      if (record.revenueShareRatio < 0 || record.revenueShareRatio > 100) {
        warnings.push(`第 ${i + 1} 行：分成比例超出范围(0-100%)`)
      }

      records.push(record)
    }

    return { records, errors, warnings }
  }

  return (
    <div className="excel-import">
      <button className="import-excel-btn" onClick={handleImport}>
        📊 从Excel导入
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default ExcelImport

