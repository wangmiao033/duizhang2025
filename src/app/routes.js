/**
 * 内部路由（activeView）与侧边栏信息架构
 */

export const VIEWS = {
  DASHBOARD: 'dashboard',
  RECON_RD: 'recon-rd',
  RECON_CHANNEL: 'recon-channel',
  RECON_MASTER: 'recon-master',
  RECON_EXCEPTIONS: 'recon-exceptions',
  SETTLE_MONTHLY: 'settle-monthly',
  SETTLE_CHANNEL: 'settle-channel',
  SETTLE_STATUS: 'settle-status',
  INVOICE_MANAGE: 'invoice-manage',
  INVOICE_VERIFY: 'invoice-verify',
  INVOICE_PAYMENT: 'invoice-payment',
  PARTNER_CONTACTS: 'partner-contacts',
  PARTNER_GAMES: 'partner-games',
  PARTNER_COMPANY: 'partner-company',
  REPORTS_IMPORT: 'reports-import',
  REPORTS_EXPORT: 'reports-export',
  REPORTS_STATS: 'reports-stats',
  REPORTS_PROFIT: 'reports-profit',
  SETTINGS_TAGS: 'settings-tags',
  SETTINGS_HISTORY: 'settings-history',
  SETTINGS_BACKUP: 'settings-backup',
  SETTINGS_APP: 'settings-app',
  /** 非侧边栏入口：快捷操作等 */
  SETTINGS_REMINDERS: 'settings-reminders'
}

export const SIDEBAR_GROUPS = [
  {
    id: 'workbench',
    label: '工作台',
    items: [{ view: VIEWS.DASHBOARD, label: '工作台' }]
  },
  {
    id: 'recon',
    label: '对账管理',
    items: [
      { view: VIEWS.RECON_RD, label: '研发对账' },
      { view: VIEWS.RECON_CHANNEL, label: '渠道对账' },
      { view: VIEWS.RECON_MASTER, label: '对账总表' },
      { view: VIEWS.RECON_EXCEPTIONS, label: '异常中心' }
    ]
  },
  {
    id: 'settlement',
    label: '结算管理',
    items: [
      { view: VIEWS.SETTLE_MONTHLY, label: '月度结算单' },
      { view: VIEWS.SETTLE_CHANNEL, label: '渠道结算单' },
      { view: VIEWS.SETTLE_STATUS, label: '结算状态' }
    ]
  },
  {
    id: 'invoice',
    label: '发票与回款',
    items: [
      { view: VIEWS.INVOICE_MANAGE, label: '发票管理' },
      { view: VIEWS.INVOICE_VERIFY, label: '发票核销' },
      { view: VIEWS.INVOICE_PAYMENT, label: '回款登记' }
    ]
  },
  {
    id: 'master',
    label: '基础资料',
    items: [
      { view: VIEWS.PARTNER_CONTACTS, label: '合作方管理' },
      { view: VIEWS.PARTNER_GAMES, label: '游戏管理' },
      { view: VIEWS.PARTNER_COMPANY, label: '公司信息' }
    ]
  },
  {
    id: 'data',
    label: '数据中心',
    items: [
      { view: VIEWS.REPORTS_IMPORT, label: 'Excel导入' },
      { view: VIEWS.REPORTS_EXPORT, label: '导出中心' },
      { view: VIEWS.REPORTS_STATS, label: '统计分析' },
      { view: VIEWS.REPORTS_PROFIT, label: '利润分析' }
    ]
  },
  {
    id: 'system',
    label: '系统设置',
    items: [
      { view: VIEWS.SETTINGS_TAGS, label: '标签管理' },
      { view: VIEWS.SETTINGS_HISTORY, label: '历史记录' },
      { view: VIEWS.SETTINGS_BACKUP, label: '数据备份' },
      { view: VIEWS.SETTINGS_APP, label: '系统设置' }
    ]
  }
]

const VIEW_TITLES = {
  [VIEWS.DASHBOARD]: '工作台',
  [VIEWS.RECON_RD]: '研发对账',
  [VIEWS.RECON_CHANNEL]: '渠道对账',
  [VIEWS.RECON_MASTER]: '对账总表',
  [VIEWS.RECON_EXCEPTIONS]: '异常中心',
  [VIEWS.SETTLE_MONTHLY]: '月度结算单',
  [VIEWS.SETTLE_CHANNEL]: '渠道结算单',
  [VIEWS.SETTLE_STATUS]: '结算状态',
  [VIEWS.INVOICE_MANAGE]: '发票管理',
  [VIEWS.INVOICE_VERIFY]: '发票核销',
  [VIEWS.INVOICE_PAYMENT]: '回款登记',
  [VIEWS.PARTNER_CONTACTS]: '合作方管理',
  [VIEWS.PARTNER_GAMES]: '游戏管理',
  [VIEWS.PARTNER_COMPANY]: '公司信息',
  [VIEWS.REPORTS_IMPORT]: 'Excel导入',
  [VIEWS.REPORTS_EXPORT]: '导出中心',
  [VIEWS.REPORTS_STATS]: '统计分析',
  [VIEWS.REPORTS_PROFIT]: '利润分析',
  [VIEWS.SETTINGS_TAGS]: '标签管理',
  [VIEWS.SETTINGS_HISTORY]: '历史记录',
  [VIEWS.SETTINGS_BACKUP]: '数据备份',
  [VIEWS.SETTINGS_APP]: '系统设置',
  [VIEWS.SETTINGS_REMINDERS]: '提醒事项'
}

export function getPageTitle(view) {
  return VIEW_TITLES[view] || '对账管理系统'
}
