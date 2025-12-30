import React from 'react'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import './ExportButton.css'

function ExportButton({ games, gameFlows, vouchers, totalFlowAmount, totalVoucherAmount }) {
  const exportToExcel = () => {
    // 创建工作簿
    const wb = XLSX.utils.book_new()

    // 创建游戏工作表
    const gamesData = games.map(game => ({
      '游戏名称': game.name,
      '平台': game.platform || '',
      '游戏类型': game.type || ''
    }))
    const gamesWS = XLSX.utils.json_to_sheet(gamesData)
    XLSX.utils.book_append_sheet(wb, gamesWS, '游戏列表')

    // 创建流水工作表
    const flowsData = gameFlows.map(flow => ({
      '游戏名称': flow.gameName,
      '日期': flow.date || '',
      '金额': parseFloat(flow.amount || 0),
      '类型': flow.type,
      '备注': flow.description || ''
    }))
    const flowsWS = XLSX.utils.json_to_sheet(flowsData)
    XLSX.utils.book_append_sheet(wb, flowsWS, '游戏流水')

    // 创建代金券工作表
    const vouchersData = vouchers.map(voucher => ({
      '游戏名称': voucher.gameName,
      '代金券代码': voucher.voucherCode || '',
      '金额': parseFloat(voucher.amount || 0),
      '日期': voucher.date || '',
      '状态': voucher.status
    }))
    const vouchersWS = XLSX.utils.json_to_sheet(vouchersData)
    XLSX.utils.book_append_sheet(wb, vouchersWS, '代金券')

    // 创建汇总工作表
    const summaryData = [
      { '项目': '游戏总数', '数值': games.length },
      { '项目': '流水记录数', '数值': gameFlows.length },
      { '项目': '流水总额', '数值': totalFlowAmount.toFixed(2) },
      { '项目': '代金券数量', '数值': vouchers.length },
      { '项目': '代金券总额', '数值': totalVoucherAmount.toFixed(2) },
      { '项目': '导出时间', '数值': dayjs().format('YYYY-MM-DD HH:mm:ss') }
    ]
    const summaryWS = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summaryWS, '汇总')

    // 导出文件
    const fileName = `对账单_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
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

