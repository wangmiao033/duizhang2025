import React from 'react'
import './CSVExport.css'

function CSVExport({ records, statistics, onExportSuccess, onExportError }) {
  const exportToCSV = () => {
    if (!records || records.length === 0) {
      onExportError?.('没有可导出的记录')
      return
    }

    try {
      // CSV表头
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

      // CSV数据行
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

      // 添加合计行
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

      // 转换为CSV格式
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      // 添加BOM以支持中文
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

      onExportSuccess?.()
    } catch (error) {
      console.error('CSV export failed', error)
      onExportError?.('CSV 导出失败，请重试')
    }
  }

  return (
    <button className="csv-export-btn" onClick={exportToCSV}>
      📄 导出CSV
    </button>
  )
}

export default CSVExport

