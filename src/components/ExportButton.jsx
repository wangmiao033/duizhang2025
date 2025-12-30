import React from 'react'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import './ExportButton.css'

function ExportButton({ 
  records, 
  partyA, 
  partyB, 
  settlementMonth,
  totalGameFlow,
  totalTestingFee,
  totalVoucher,
  totalSettlementAmount
}) {
  const exportToExcel = () => {
    if (records.length === 0) {
      alert('请先添加对账记录！')
      return
    }

    // 创建工作簿
    const wb = XLSX.utils.book_new()

    // 准备数据
    const title = `${partyB.companyName || '合作方'}&${partyA.invoiceTitle || '甲方'}-${settlementMonth || dayjs().format('YYYY年MM月')}结算对账单`
    
    // 创建主数据表
    const wsData = []

    // 标题行
    wsData.push([title])
    wsData.push([]) // 空行

    // 表头
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
      '结算金额(元)',
      '退款',
      '折扣'
    ]
    wsData.push(headers)

    // 数据行
    records.forEach(record => {
      wsData.push([
        record.settlementMonth || '',
        record.partner || '',
        record.game || '',
        parseFloat(record.gameFlow || 0),
        parseFloat(record.testingFee || 0),
        parseFloat(record.voucher || 0),
        record.channelFeeRate ? `${record.channelFeeRate}%` : '',
        record.taxPoint ? `${record.taxPoint}%` : '',
        record.revenueShareRatio ? `${record.revenueShareRatio}%` : '',
        parseFloat(record.settlementAmount || 0),
        parseFloat(record.refund || 0),
        record.discount || ''
      ])
    })

    // 合计行
    wsData.push([
      '合计',
      '',
      '',
      totalGameFlow,
      totalTestingFee,
      totalVoucher,
      '',
      '',
      '',
      totalSettlementAmount,
      records.reduce((sum, r) => sum + (parseFloat(r.refund) || 0), 0),
      ''
    ])

    wsData.push([]) // 空行
    wsData.push([]) // 空行

    // 甲方信息
    wsData.push(['甲方信息'])
    wsData.push(['发票抬头', partyA.invoiceTitle || ''])
    wsData.push(['发票内容', partyA.invoiceContent || ''])
    wsData.push(['开票税务登记号', partyA.taxRegistrationNo || ''])
    wsData.push(['开票地址', partyA.invoiceAddress || ''])
    wsData.push(['开票基本户银行', partyA.bankName || ''])
    wsData.push(['开票基本户账号', partyA.bankAccount || ''])
    wsData.push(['电话', partyA.phone || ''])

    wsData.push([]) // 空行

    // 乙方信息
    wsData.push(['乙方信息'])
    wsData.push(['公司名称', partyB.companyName || ''])
    wsData.push(['账户开户行', partyB.bankName || ''])
    wsData.push(['银行账号', partyB.bankAccount || ''])

    wsData.push([]) // 空行
    wsData.push([]) // 空行

    // 备注
    wsData.push(['备注 (很重要!)'])
    wsData.push(['1. 本对账单作为双方对账及付款凭证，结算金额列为本月甲方支付给乙方的具体费用，请仔细阅读备注，避免延误付款。'])
    wsData.push(['2. 本对账单需要贵公司确认数据无误后，加盖公章或财务章，竖版打印1份，邮寄回我司。如贵公司需要邮寄回对账单，请竖版打印2份。本对账单双方盖章后生效。'])
    wsData.push(['3. 纸质发票审核人和开票人不能为同一人，开票人不能为管理员！！电子发票需要PDF格式回传，只需邮寄原始对账单！！'])
    wsData.push(['4. 如贵公司开具6%专用增值税发票，税点为0；如开具3%专用增值税发票，税点为3.72%；如开具普通发票，税点为6.72%。'])
    wsData.push(['5. 邮寄地址：厦门市集美区软件园三期B区百通科技园一号楼10楼04巴掌互动 冯淑丽 18850222127'])
    wsData.push(['6. 合同编号：XMBZ2024113'])
    wsData.push(['   合同签订：2024/12/1'])
    wsData.push(['   合同到期：2028/12/1'])

    wsData.push([]) // 空行
    wsData.push([]) // 空行

    // 签名区域
    wsData.push(['甲方:', partyA.invoiceTitle || ''])
    wsData.push(['公司盖章:', ''])
    wsData.push([])
    wsData.push(['乙方:', partyB.companyName || ''])
    wsData.push(['公司盖章:', ''])

    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // 设置列宽
    const colWidths = [
      { wch: 12 }, // 结算月份
      { wch: 12 }, // 合作方
      { wch: 25 }, // 游戏
      { wch: 12 }, // 游戏流水
      { wch: 10 }, // 测试费
      { wch: 10 }, // 代金券
      { wch: 10 }, // 通道费率
      { wch: 8 },  // 税点
      { wch: 10 }, // 分成比例
      { wch: 12 }, // 结算金额
      { wch: 10 }, // 退款
      { wch: 8 }   // 折扣
    ]
    ws['!cols'] = colWidths

    // 设置标题样式（合并单元格）
    if (!ws['!merges']) ws['!merges'] = []
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 11 } })

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '对账单')

    // 导出文件
    const fileName = `${title}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
    XLSX.writeFile(wb, fileName)
    
    alert('对账单导出成功！')
  }

  return (
    <button className="export-btn" onClick={exportToExcel}>
      📥 导出对账单 (Excel)
    </button>
  )
}

export default ExportButton
