import React, { useState, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import {
  buildSettlementSheetAoa,
  applySettlementSheetLayout
} from '@/domain/export/settlementConfirmationExport.js'
import './BillExport.css'

function BillExport({
  records,
  partyA,
  partyB,
  settlementMonth,
  statistics,
  onExportSuccess,
  onExportError,
  variant = 'default',
  className = ''
}) {
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  // 计算菜单位置
  useEffect(() => {
    if (showMenu && buttonRef.current) {
      const updateMenuPosition = () => {
        if (buttonRef.current) {
          const buttonRect = buttonRef.current.getBoundingClientRect()
          setMenuPosition({
            top: buttonRect.bottom + 8,
            right: window.innerWidth - buttonRect.right
          })
        }
      }
      
      updateMenuPosition()
      
      // 监听滚动和窗口大小变化
      window.addEventListener('scroll', updateMenuPosition, true)
      window.addEventListener('resize', updateMenuPosition)
      
      return () => {
        window.removeEventListener('scroll', updateMenuPosition, true)
        window.removeEventListener('resize', updateMenuPosition)
      }
    }
  }, [showMenu])

  // 导出Excel：下拉「Excel」= 当前 props.records 单 sheet（与「导出选中」分离）
  const exportToExcel = () => {
    if (!records || records.length === 0) {
      onExportError?.('没有可导出的记录')
      return
    }

    try {
      const wb = XLSX.utils.book_new()
      const wsData = buildSettlementSheetAoa(records)
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      applySettlementSheetLayout(ws)
      XLSX.utils.book_append_sheet(wb, ws, '结算确认单')
      const fileName = `结算确认单_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
      XLSX.writeFile(wb, fileName)

      setShowMenu(false)
      onExportSuccess?.('Excel格式账单导出成功！')
    } catch (error) {
      console.error('Excel export failed', error)
      onExportError?.('导出失败，请重试或检查浏览器权限')
    }
  }

  // 导出PDF格式
  const exportToPDF = () => {
    if (!records || records.length === 0) {
      onExportError?.('没有可导出的记录')
      return
    }

    try {
      const printWindow = window.open('', '_blank')
      const printContent = generatePDFContent(records, partyA, partyB, settlementMonth, statistics)
      
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      
      setTimeout(() => {
        printWindow.print()
        setShowMenu(false)
        onExportSuccess?.('PDF格式账单导出成功！')
      }, 250)
    } catch (error) {
      console.error('PDF export failed', error)
      onExportError?.('PDF 导出失败，请重试')
    }
  }

  const generatePDFContent = (records, partyA, partyB, settlementMonth, statistics) => {
    const title = `${partyB.companyName || '合作方'}&${partyA.invoiceTitle || '甲方'}-${settlementMonth || '结算'}对账单`
    const currentDate = new Date().toLocaleString('zh-CN')
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @media print {
      @page {
        margin: 1.5cm;
        size: A4;
      }
      body {
        margin: 0;
        padding: 0;
      }
    }
    body {
      font-family: 'Microsoft YaHei', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 20px;
    }
    .pdf-header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #333;
      padding-bottom: 20px;
    }
    .pdf-header h1 {
      margin: 0 0 10px 0;
      font-size: 22pt;
      font-weight: bold;
    }
    .pdf-header .date {
      font-size: 10pt;
      color: #666;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 9pt;
    }
    th, td {
      border: 1px solid #333;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f0f0f0;
      font-weight: bold;
      text-align: center;
    }
    .total-row {
      font-weight: bold;
      background-color: #f9f9f9;
    }
    .info-section {
      margin-top: 30px;
      page-break-inside: avoid;
    }
    .info-section h3 {
      margin-top: 0;
      border-bottom: 2px solid #333;
      padding-bottom: 5px;
      font-size: 12pt;
    }
    .info-item {
      margin: 8px 0;
      padding: 5px 0;
    }
    .info-label {
      font-weight: bold;
      display: inline-block;
      width: 120px;
    }
    .signature-area {
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      width: 45%;
      border-top: 2px solid #333;
      padding-top: 10px;
      margin-top: 60px;
    }
  </style>
</head>
<body>
  <div class="pdf-header">
    <h1>${title}</h1>
    <div class="date">生成时间: ${currentDate}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 8%">结算月份</th>
        <th style="width: 8%">合作方</th>
        <th style="width: 15%">游戏</th>
        <th style="width: 10%">游戏流水</th>
        <th style="width: 8%">测试费</th>
        <th style="width: 8%">代金券</th>
        <th style="width: 8%">通道费率</th>
        <th style="width: 6%">税点</th>
        <th style="width: 8%">分成比例</th>
        <th style="width: 6%">折扣</th>
        <th style="width: 6%">退款</th>
        <th style="width: 10%">结算金额</th>
      </tr>
    </thead>
    <tbody>
      ${records.map(record => `
        <tr>
          <td>${record.settlementMonth || '-'}</td>
          <td>${record.partner || '-'}</td>
          <td>${record.game || '-'}</td>
          <td style="text-align: right">¥${parseFloat(record.gameFlow || 0).toFixed(2)}</td>
          <td style="text-align: right">¥${parseFloat(record.testingFee || 0).toFixed(2)}</td>
          <td style="text-align: right">¥${parseFloat(record.voucher || 0).toFixed(2)}</td>
          <td style="text-align: center">${record.channelFeeRate || '0'}%</td>
          <td style="text-align: center">${record.taxPoint || '0'}%</td>
          <td style="text-align: center">${record.revenueShareRatio || '0'}%</td>
          <td style="text-align: center">${record.discount || '0'}</td>
          <td style="text-align: right">¥${parseFloat(record.refund || 0).toFixed(2)}</td>
          <td style="text-align: right; font-weight: bold">¥${parseFloat(record.settlementAmount || 0).toFixed(2)}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td colspan="2" style="text-align: center"><strong>合计</strong></td>
        <td>-</td>
        <td style="text-align: right"><strong>¥${statistics.totalGameFlow.toFixed(2)}</strong></td>
        <td style="text-align: right"><strong>¥${statistics.totalTestingFee.toFixed(2)}</strong></td>
        <td style="text-align: right"><strong>¥${statistics.totalVoucher.toFixed(2)}</strong></td>
        <td colspan="4">-</td>
        <td style="text-align: right"><strong>¥${records.reduce((sum, r) => sum + (parseFloat(r.refund) || 0), 0).toFixed(2)}</strong></td>
        <td style="text-align: right"><strong>¥${statistics.totalSettlementAmount.toFixed(2)}</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="info-section">
    <h3>甲方信息</h3>
    <div class="info-item"><span class="info-label">发票抬头：</span>${partyA.invoiceTitle || ''}</div>
    <div class="info-item"><span class="info-label">发票内容：</span>${partyA.invoiceContent || ''}</div>
    <div class="info-item"><span class="info-label">开票税务登记号：</span>${partyA.taxRegistrationNo || ''}</div>
    <div class="info-item"><span class="info-label">开票地址：</span>${partyA.invoiceAddress || ''}</div>
    <div class="info-item"><span class="info-label">开票基本户银行：</span>${partyA.bankName || ''}</div>
    <div class="info-item"><span class="info-label">开票基本户账号：</span>${partyA.bankAccount || ''}</div>
    <div class="info-item"><span class="info-label">电话：</span>${partyA.phone || ''}</div>
  </div>

  <div class="info-section">
    <h3>乙方信息</h3>
    <div class="info-item"><span class="info-label">公司名称：</span>${partyB.companyName || ''}</div>
    <div class="info-item"><span class="info-label">账户开户行：</span>${partyB.bankName || ''}</div>
    <div class="info-item"><span class="info-label">银行账号：</span>${partyB.bankAccount || ''}</div>
  </div>

  <div class="signature-area">
    <div class="signature-box">
      <strong>甲方：</strong>${partyA.invoiceTitle || ''}<br>
      公司盖章：<br><br><br>
    </div>
    <div class="signature-box">
      <strong>乙方：</strong>${partyB.companyName || ''}<br>
      公司盖章：<br><br><br>
    </div>
  </div>
</body>
</html>
    `
  }

  // 导出CSV格式
  const exportToCSV = () => {
    if (!records || records.length === 0) {
      onExportError?.('没有可导出的记录')
      return
    }

    try {
      const headers = [
        '结算月份',
        '合作方',
        '游戏',
        '游戏流水',
        '测试费',
        '代金券',
        '通道费率',
        '税点',
        '分成比例',
        '折扣',
        '退款',
        '结算金额'
      ]

      const rows = records.map(record => [
        record.settlementMonth || '',
        record.partner || '',
        record.game || '',
        parseFloat(record.gameFlow || 0).toFixed(2),
        parseFloat(record.testingFee || 0).toFixed(2),
        parseFloat(record.voucher || 0).toFixed(2),
        record.channelFeeRate || '0',
        record.taxPoint || '0',
        record.revenueShareRatio || '0',
        record.discount || '0',
        parseFloat(record.refund || 0).toFixed(2),
        parseFloat(record.settlementAmount || 0).toFixed(2)
      ])

      rows.push([
        '合计',
        '',
        '',
        statistics.totalGameFlow.toFixed(2),
        statistics.totalTestingFee.toFixed(2),
        statistics.totalVoucher.toFixed(2),
        '',
        '',
        '',
        '',
        records.reduce((sum, r) => sum + (parseFloat(r.refund) || 0), 0).toFixed(2),
        statistics.totalSettlementAmount.toFixed(2)
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `对账单_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setShowMenu(false)
      onExportSuccess?.('CSV格式账单导出成功！')
    } catch (error) {
      console.error('CSV export failed', error)
      onExportError?.('CSV 导出失败，请重试')
    }
  }

  const handleButtonClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('导出账单按钮被点击', { recordsCount: records?.length, showMenu })
    if (records && records.length > 0) {
      setShowMenu(!showMenu)
      console.log('菜单状态切换为:', !showMenu)
    } else {
      const errorMsg = '没有可导出的记录，请先添加对账记录'
      console.warn(errorMsg)
      onExportError?.(errorMsg)
    }
  }

  const handleMenuClick = (e) => {
    e.stopPropagation()
  }

  const rootClass = ['bill-export', variant === 'toolbar' ? 'bill-export--toolbar' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass}>
      <button 
        ref={buttonRef}
        className={`bill-export-btn ${showMenu ? 'menu-open' : ''} ${!records || records.length === 0 ? 'disabled' : ''}`}
        onClick={handleButtonClick}
        title={records && records.length > 0 ? "导出对账单" : "请先添加对账记录"}
        type="button"
      >
        📥 导出账单
        <span className="dropdown-arrow">▼</span>
      </button>
      
      {showMenu && (
        <>
          <div 
            className="bill-export-overlay" 
            onClick={() => setShowMenu(false)}
          />
          <div 
            ref={menuRef}
            className="bill-export-menu"
            onClick={handleMenuClick}
            style={{
              top: `${menuPosition.top}px`,
              right: `${menuPosition.right}px`
            }}
          >
            <button 
              className="export-menu-item" 
              onClick={(e) => {
                e.stopPropagation()
                exportToExcel()
              }}
              title="导出Excel格式的结算确认单"
              type="button"
            >
              📊 Excel格式
            </button>
            <button 
              className="export-menu-item" 
              onClick={(e) => {
                e.stopPropagation()
                exportToPDF()
              }}
              title="导出PDF格式的对账单"
              type="button"
            >
              📄 PDF格式
            </button>
            <button 
              className="export-menu-item" 
              onClick={(e) => {
                e.stopPropagation()
                exportToCSV()
              }}
              title="导出CSV格式的数据"
              type="button"
            >
              📋 CSV格式
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default BillExport
