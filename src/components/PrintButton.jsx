import React from 'react'
import './PrintButton.css'

function PrintButton({ records, partyA, partyB, settlementMonth, statistics }) {
  const handlePrint = () => {
    if (records.length === 0) {
      alert('没有可打印的数据！')
      return
    }

    // 创建打印内容
    const printWindow = window.open('', '_blank')
    const printContent = generatePrintContent(records, partyA, partyB, settlementMonth, statistics)
    
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    
    // 等待内容加载后打印
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const generatePrintContent = (records, partyA, partyB, settlementMonth, statistics) => {
    const title = `${partyB.companyName || '合作方'}&${partyA.invoiceTitle || '甲方'}-${settlementMonth || '结算'}对账单`
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @media print {
      @page {
        margin: 2cm;
      }
      body {
        margin: 0;
        padding: 0;
      }
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.6;
    }
    .print-header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
    }
    .print-header h1 {
      margin: 0;
      font-size: 24px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th, td {
      border: 1px solid #333;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f0f0f0;
      font-weight: bold;
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
      border-bottom: 1px solid #333;
      padding-bottom: 5px;
    }
    .info-item {
      margin: 5px 0;
    }
    .print-footer {
      margin-top: 40px;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="print-header">
    <h1>${title}</h1>
    <p>打印时间: ${new Date().toLocaleString('zh-CN')}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>结算月份</th>
        <th>合作方</th>
        <th>游戏</th>
        <th>游戏流水</th>
        <th>测试费</th>
        <th>代金券</th>
        <th>通道费率</th>
        <th>税点</th>
        <th>分成比例</th>
        <th>折扣</th>
        <th>退款</th>
        <th>结算金额</th>
      </tr>
    </thead>
    <tbody>
      ${records.map(record => `
        <tr>
          <td>${record.settlementMonth || '-'}</td>
          <td>${record.partner || '-'}</td>
          <td>${record.game || '-'}</td>
          <td>¥${parseFloat(record.gameFlow || 0).toFixed(2)}</td>
          <td>¥${parseFloat(record.testingFee || 0).toFixed(2)}</td>
          <td>¥${parseFloat(record.voucher || 0).toFixed(2)}</td>
          <td>${record.channelFeeRate || '0'}%</td>
          <td>${record.taxPoint || '0'}%</td>
          <td>${record.revenueShareRatio || '0'}%</td>
          <td>${record.discount || '0'}</td>
          <td>¥${parseFloat(record.refund || 0).toFixed(2)}</td>
          <td>¥${parseFloat(record.settlementAmount || 0).toFixed(2)}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td colspan="2">合计</td>
        <td>-</td>
        <td>¥${statistics.totalGameFlow.toFixed(2)}</td>
        <td>¥${statistics.totalTestingFee.toFixed(2)}</td>
        <td>¥${statistics.totalVoucher.toFixed(2)}</td>
        <td colspan="4">-</td>
        <td>¥${records.reduce((sum, r) => sum + (parseFloat(r.refund) || 0), 0).toFixed(2)}</td>
        <td>¥${statistics.totalSettlementAmount.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div class="info-section">
    <h3>甲方信息</h3>
    <div class="info-item">发票抬头: ${partyA.invoiceTitle || ''}</div>
    <div class="info-item">发票内容: ${partyA.invoiceContent || ''}</div>
    <div class="info-item">开票税务登记号: ${partyA.taxRegistrationNo || ''}</div>
    <div class="info-item">开票地址: ${partyA.invoiceAddress || ''}</div>
    <div class="info-item">开票基本户银行: ${partyA.bankName || ''}</div>
    <div class="info-item">开票基本户账号: ${partyA.bankAccount || ''}</div>
    <div class="info-item">电话: ${partyA.phone || ''}</div>
  </div>

  <div class="info-section">
    <h3>乙方信息</h3>
    <div class="info-item">公司名称: ${partyB.companyName || ''}</div>
    <div class="info-item">账户开户行: ${partyB.bankName || ''}</div>
    <div class="info-item">银行账号: ${partyB.bankAccount || ''}</div>
  </div>

  <div class="print-footer">
    <p><strong>甲方:</strong> ${partyA.invoiceTitle || ''} 公司盖章: ___________</p>
    <p><strong>乙方:</strong> ${partyB.companyName || ''} 公司盖章: ___________</p>
  </div>
</body>
</html>
    `
  }

  return (
    <button className="print-btn" onClick={handlePrint}>
      🖨️ 打印对账单
    </button>
  )
}

export default PrintButton

