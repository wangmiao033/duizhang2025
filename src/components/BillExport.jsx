import React, { useState, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
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

  const formatNumber = (value) => Number(value || 0)

  // 阿拉伯数字转中文大写金额
  const toChineseUppercase = (num) => {
    if (isNaN(num)) return ''
    const units = '仟佰拾亿仟佰拾万仟佰拾元角分'
    const chars = '零壹贰叁肆伍陆柒捌玖'
    const str = (Math.round(num * 100)).toString()
    const len = str.length
    if (len > units.length) return `${num}`
    let result = ''
    for (let i = 0; i < len; i += 1) {
      const digit = parseInt(str[i], 10)
      const unit = units[units.length - len + i]
      result += `${chars[digit]}${unit}`
    }
    result = result
      .replace(/零[仟佰拾]/g, '零')
      .replace(/零{2,}/g, '零')
      .replace(/零(万|亿|元)/g, '$1')
      .replace(/亿万/g, '亿')
      .replace(/零角零分$/, '整')
      .replace(/零分$/, '整')
      .replace(/零角/, '')
    return result
  }

  // 导出Excel格式
  const exportToExcel = () => {
    if (!records || records.length === 0) {
      onExportError?.('没有可导出的记录')
      return
    }

    try {
      const wb = XLSX.utils.book_new()
      const title = '结算确认单'
      const today = dayjs().format('YYYY年MM月DD日')

      const wsData = []

      // 标题
      wsData.push([title])
      wsData.push([])
      wsData.push(['收方：', partyB?.companyName || '', '', '', '出具日期：', today])
      wsData.push(['付款方：', partyA?.invoiceTitle || ''])
      wsData.push([])

      // 表头
      const headers = [
        '结算周期',
        '游戏项目',
        '充值金额',
        '代金券',
        '退款',
        '平台币（赠送）',
        '合作方分成比例',
        '通道费率',
        '税率',
        '合作方分成收入'
      ]
      wsData.push(headers)

      // 数据行
      records.forEach(record => {
        const recharge = formatNumber(record.gameFlow)
        const voucher = formatNumber(record.voucher)
        const refund = formatNumber(record.refund)
        const platformCoin = formatNumber(record.testingFee)
        const shareRatio = record.revenueShareRatio ? `${record.revenueShareRatio}%` : '0%'
        const channel = record.channelFeeRate ? `${record.channelFeeRate}%` : '0%'
        const tax = record.taxPoint ? `${record.taxPoint}%` : '0%'
        const income = formatNumber(record.settlementAmount)
        wsData.push([
          record.settlementMonth || '',
          record.game || '',
          recharge.toFixed(2),
          voucher.toFixed(2),
          refund.toFixed(2),
          platformCoin.toFixed(2),
          shareRatio,
          channel,
          tax,
          income.toFixed(2)
        ])
      })

      // 合计行
      const totalRefund = records.reduce((sum, r) => sum + (parseFloat(r.refund) || 0), 0)
      const totalPlatform = records.reduce((sum, r) => sum + (parseFloat(r.testingFee) || 0), 0)
      wsData.push([
        '合计',
        '',
        formatNumber(statistics.totalGameFlow).toFixed(2),
        formatNumber(statistics.totalVoucher).toFixed(2),
        totalRefund.toFixed(2),
        totalPlatform.toFixed(2),
        '',
        '',
        '',
        formatNumber(statistics.totalSettlementAmount).toFixed(2)
      ])

      wsData.push([])
      wsData.push([`支付金额（大写）：${toChineseUppercase(statistics.totalSettlementAmount)}`])
      wsData.push([`支付金额（数字）：${formatNumber(statistics.totalSettlementAmount).toFixed(2)}`])
      wsData.push([])

      // 付款方信息
      wsData.push(['付款方开票信息'])
      wsData.push(['公司名称', partyA?.invoiceTitle || ''])
      wsData.push(['税务登记号', partyA?.taxRegistrationNo || ''])
      wsData.push(['地址电话', `${partyA?.invoiceAddress || ''} ${partyA?.phone || ''}`.trim()])
      wsData.push(['开户行及账号', `${partyA?.bankName || ''} ${partyA?.bankAccount || ''}`.trim()])
      wsData.push(['开票内容', partyA?.invoiceContent || ''])
      wsData.push([])

      // 收款方信息
      wsData.push(['收款方银行信息'])
      wsData.push(['公司名称', partyB?.companyName || ''])
      wsData.push(['开户银行', partyB?.bankName || ''])
      wsData.push(['银行账号', partyB?.bankAccount || ''])
      wsData.push([])

      // 盖章区域
      wsData.push(['盖公章：'])
      wsData.push(['时间：'])

      const ws = XLSX.utils.aoa_to_sheet(wsData)

      // 列宽
      const colWidths = [
        { wch: 16 }, { wch: 26 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
        { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 16 }
      ]
      ws['!cols'] = colWidths

      // 合并单元格
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
        { s: { r: 2, c: 1 }, e: { r: 2, c: 3 } },
        { s: { r: 2, c: 5 }, e: { r: 2, c: 9 } },
        { s: { r: 3, c: 1 }, e: { r: 3, c: 9 } }
      ]
      ws['!rows'] = []
      ws['!rows'][0] = { hpt: 28 }
      ws['!rows'][5] = { hpt: 22 }

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
