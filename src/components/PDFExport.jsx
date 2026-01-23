import React from 'react'
import './PDFExport.css'

function PDFExport({ records, partyA, partyB, settlementMonth, statistics, onExportSuccess, onExportError }) {
  const exportToPDF = () => {
    if (!records || records.length === 0) {
      onExportError?.('没有可导出的记录')
      return
    }

    try {
      // 创建打印窗口
      const printWindow = window.open('', '_blank')
      const printContent = generatePDFContent(records, partyA, partyB, settlementMonth, statistics)
      
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      
      // 等待内容加载后打印或保存为PDF
      setTimeout(() => {
        printWindow.print()
        onExportSuccess?.()
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
    .print-footer {
      margin-top: 40px;
      page-break-inside: avoid;
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

  <div class="print-footer">
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
  </div>
</body>
</html>
    `
  }

  return (
    <button className="pdf-export-btn" onClick={exportToPDF}>
      📄 导出PDF
    </button>
  )
}

export default PDFExport

