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
        const records = parseExcelData(jsonData)
        
        if (records.length > 0 && onImport) {
          onImport(records)
        } else {
          alert('未能从Excel文件中解析到有效数据，请检查文件格式！')
        }
      } catch (error) {
        console.error('导入失败:', error)
        alert('文件格式错误，请选择正确的Excel文件！')
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = '' // 重置文件输入
  }

  const parseExcelData = (jsonData) => {
    if (jsonData.length < 2) return []

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

    if (headerRowIndex === -1) return []

    const records = []
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

    // 解析数据行
    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i] || []
      if (row.length === 0 || !row[0]) continue // 跳过空行

      const record = {
        id: Date.now() + i,
        settlementMonth: row[fieldMap['结算月份']] || '',
        partner: row[fieldMap['合作方']] || '',
        game: row[fieldMap['游戏']] || '',
        gameFlow: parseFloat(row[fieldMap['游戏流水']]) || 0,
        testingFee: parseFloat(row[fieldMap['测试费']]) || 0,
        voucher: parseFloat(row[fieldMap['代金券']]) || 0,
        channelFeeRate: parseFloat(row[fieldMap['通道费率']]) || 5,
        taxPoint: parseFloat(row[fieldMap['税点']]) || 0,
        revenueShareRatio: parseFloat(row[fieldMap['分成比例']]) || 30,
        discount: parseFloat(row[fieldMap['折扣']]) || 0.005,
        refund: parseFloat(row[fieldMap['退款']]) || 0,
        settlementAmount: parseFloat(row[fieldMap['结算金额']]) || 0
      }

      // 只添加有游戏名称或游戏流水的记录
      if (record.game || record.gameFlow > 0) {
        records.push(record)
      }
    }

    return records
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

