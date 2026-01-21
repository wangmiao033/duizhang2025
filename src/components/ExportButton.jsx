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
  totalSettlementAmount,
  onExportSuccess,
  onExportError
}) {
  const formatNumber = (value) => Number(value || 0)

  // 阿拉伯数字转中文大写金额（简化版）
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

  const exportToExcel = () => {
    if (!records || records.length === 0) {
      onExportError?.('没有可导出的记录')
      return
    }

    try {
      // 创建工作簿
      const wb = XLSX.utils.book_new()
      const title = '结算确认单'
      const today = dayjs().format('YYYY年MM月DD日')

      // 创建主数据表
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
        const platformCoin = formatNumber(record.testingFee) // 暂用测试费字段作为赠送币
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
        formatNumber(totalGameFlow).toFixed(2),
        formatNumber(totalVoucher).toFixed(2),
        totalRefund.toFixed(2),
        totalPlatform.toFixed(2),
        '',
        '',
        '',
        formatNumber(totalSettlementAmount).toFixed(2)
      ])

      wsData.push([])
      wsData.push([`支付金额（大写）：${toChineseUppercase(totalSettlementAmount)}`])
      wsData.push([`支付金额（数字）：${formatNumber(totalSettlementAmount).toFixed(2)}`])
      wsData.push([])

      // 付款方信息（甲方）
      wsData.push(['付款方开票信息'])
      wsData.push(['公司名称', partyA?.invoiceTitle || ''])
      wsData.push(['税务登记号', partyA?.taxRegistrationNo || ''])
      wsData.push(['地址电话', `${partyA?.invoiceAddress || ''} ${partyA?.phone || ''}`.trim()])
      wsData.push(['开户行及账号', `${partyA?.bankName || ''} ${partyA?.bankAccount || ''}`.trim()])
      wsData.push(['开票内容', partyA?.invoiceContent || ''])
      wsData.push([])

      // 收款方信息（乙方）
      wsData.push(['收款方银行信息'])
      wsData.push(['公司名称', partyB?.companyName || ''])
      wsData.push(['开户银行', partyB?.bankName || ''])
      wsData.push(['银行账号', partyB?.bankAccount || ''])
      wsData.push([])

      // 盖章区域
      wsData.push(['盖公章：'])
      wsData.push(['时间：'])
      wsData.push([])

      // 创建工作表
      const ws = XLSX.utils.aoa_to_sheet(wsData)

      // 列宽
      const colWidths = [
        { wch: 16 }, // 结算周期
        { wch: 26 }, // 游戏项目
        { wch: 14 }, // 充值金额
        { wch: 12 }, // 代金券
        { wch: 12 }, // 退款
        { wch: 14 }, // 平台币
        { wch: 14 }, // 分成比例
        { wch: 12 }, // 通道费率
        { wch: 10 }, // 税率
        { wch: 16 }  // 分成收入
      ]
      ws['!cols'] = colWidths

      // 合并与行高
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
        { s: { r: 2, c: 1 }, e: { r: 2, c: 3 } },
        { s: { r: 2, c: 5 }, e: { r: 2, c: 9 } },
        { s: { r: 3, c: 1 }, e: { r: 3, c: 9 } }
      ]
      ws['!rows'] = []
      ws['!rows'][0] = { hpt: 28 }
      ws['!rows'][5] = { hpt: 22 }

      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(wb, ws, '结算确认单')

      // 导出文件
      const fileName = `结算确认单_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
      XLSX.writeFile(wb, fileName)
      
      if (onExportSuccess) {
        onExportSuccess()
      }
    } catch (error) {
      console.error('Excel export failed', error)
      onExportError?.('导出失败，请重试或检查浏览器权限')
    }
  }

  return (
    <button className="export-btn" onClick={exportToExcel}>
      📥 导出对账单 (Excel)
    </button>
  )
}

export default ExportButton
