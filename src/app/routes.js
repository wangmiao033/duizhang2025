/**
 * 内部路由（activeView）与侧边栏信息架构
 */

export const VIEWS = {
  DASHBOARD: 'dashboard',
  RECON_RD: 'recon-rd',
  /** 完整录入新增（独立页） */
  RECON_CREATE: 'recon-create',
  /** 完整编辑（独立页，通常从列表进入，不常驻侧栏） */
  RECON_EDIT: 'recon-edit',
  RECON_CHANNEL: 'recon-channel',
  RECON_MASTER: 'recon-master',
  RECON_EXCEPTIONS: 'recon-exceptions',
  /** 对账操作历史（localStorage operationHistory） */
  RECON_HISTORY: 'recon-history',
  /** 本地备份 / 导入导出 JSON（DataBackup） */
  DATA_BACKUP_RESTORE: 'data-backup-restore',
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
      { view: VIEWS.RECON_CREATE, label: '新增研发对账记录' },
      { view: VIEWS.RECON_CHANNEL, label: '渠道对账' },
      { view: VIEWS.RECON_MASTER, label: '对账总表' },
      { view: VIEWS.RECON_EXCEPTIONS, label: '异常中心' },
      { view: VIEWS.RECON_HISTORY, label: '操作历史' }
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
      { view: VIEWS.DATA_BACKUP_RESTORE, label: '备份恢复' }
    ]
  },
  {
    id: 'analytics',
    label: '分析报表',
    items: [
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
  [VIEWS.RECON_CREATE]: '新增研发对账记录',
  [VIEWS.RECON_EDIT]: '编辑研发对账记录',
  [VIEWS.RECON_CHANNEL]: '渠道对账',
  [VIEWS.RECON_MASTER]: '对账总表',
  [VIEWS.RECON_EXCEPTIONS]: '异常中心',
  [VIEWS.RECON_HISTORY]: '操作历史',
  [VIEWS.DATA_BACKUP_RESTORE]: '备份恢复',
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

/** 页面副标题 / 说明（顶栏与页头共用） */
const VIEW_DESCRIPTIONS = {
  [VIEWS.DASHBOARD]: '快捷入口、待办与常用工具总览',
  [VIEWS.RECON_RD]: '研发侧对账记录、筛选、统计与导出',
  [VIEWS.RECON_CREATE]: '完整表单录入新记录，与编辑页共用同一套 DataForm 与校验',
  [VIEWS.RECON_EDIT]: '完整编辑已有记录；保存后返回研发对账列表',
  [VIEWS.RECON_CHANNEL]: '渠道对账数据维护与核对',
  [VIEWS.RECON_MASTER]: '全量对账汇总视图',
  [VIEWS.RECON_EXCEPTIONS]: '差异与异常集中处理',
  [VIEWS.RECON_HISTORY]: '本地操作历史（operationHistory）',
  [VIEWS.DATA_BACKUP_RESTORE]: 'JSON 备份与恢复',
  [VIEWS.SETTLE_MONTHLY]: '月度结算单生成与查看',
  [VIEWS.SETTLE_CHANNEL]: '渠道维度结算',
  [VIEWS.SETTLE_STATUS]: '结算进度与状态跟踪',
  [VIEWS.INVOICE_MANAGE]: '发票开具与台账',
  [VIEWS.INVOICE_VERIFY]: '发票核销与勾稽',
  [VIEWS.INVOICE_PAYMENT]: '回款登记与流水',
  [VIEWS.PARTNER_CONTACTS]: '合作方联系人维护',
  [VIEWS.PARTNER_GAMES]: '游戏/项目主数据',
  [VIEWS.PARTNER_COMPANY]: '本公司信息',
  [VIEWS.REPORTS_IMPORT]: 'Excel 批量导入',
  [VIEWS.REPORTS_EXPORT]: '导出任务与下载',
  [VIEWS.REPORTS_STATS]: '统计图表与汇总',
  [VIEWS.REPORTS_PROFIT]: '利润与毛利分析',
  [VIEWS.SETTINGS_TAGS]: '业务标签与分类',
  [VIEWS.SETTINGS_HISTORY]: '系统内历史记录',
  [VIEWS.SETTINGS_BACKUP]: '数据备份选项',
  [VIEWS.SETTINGS_APP]: '主题、格式与默认参数',
  [VIEWS.SETTINGS_REMINDERS]: '提醒与待办配置'
}

/** 侧栏与导航图标（纯文本符号，无额外依赖） */
export const VIEW_ICONS = {
  [VIEWS.DASHBOARD]: '台',
  [VIEWS.RECON_RD]: '研',
  [VIEWS.RECON_CREATE]: '增',
  [VIEWS.RECON_EDIT]: '改',
  [VIEWS.RECON_CHANNEL]: '渠',
  [VIEWS.RECON_MASTER]: '总',
  [VIEWS.RECON_EXCEPTIONS]: '异',
  [VIEWS.RECON_HISTORY]: '史',
  [VIEWS.DATA_BACKUP_RESTORE]: '备',
  [VIEWS.SETTLE_MONTHLY]: '月',
  [VIEWS.SETTLE_CHANNEL]: '结',
  [VIEWS.SETTLE_STATUS]: '态',
  [VIEWS.INVOICE_MANAGE]: '票',
  [VIEWS.INVOICE_VERIFY]: '核',
  [VIEWS.INVOICE_PAYMENT]: '款',
  [VIEWS.PARTNER_CONTACTS]: '人',
  [VIEWS.PARTNER_GAMES]: '游',
  [VIEWS.PARTNER_COMPANY]: '司',
  [VIEWS.REPORTS_IMPORT]: '导',
  [VIEWS.REPORTS_EXPORT]: '出',
  [VIEWS.REPORTS_STATS]: '析',
  [VIEWS.REPORTS_PROFIT]: '利',
  [VIEWS.SETTINGS_TAGS]: '签',
  [VIEWS.SETTINGS_HISTORY]: '志',
  [VIEWS.SETTINGS_BACKUP]: '档',
  [VIEWS.SETTINGS_APP]: '设',
  [VIEWS.SETTINGS_REMINDERS]: '铃'
}

export function getPageDescription(view) {
  return VIEW_DESCRIPTIONS[view] || '财务对账与结算管理'
}

export function getPageMeta(view) {
  return {
    title: getPageTitle(view),
    description: getPageDescription(view)
  }
}

/**
 * 面包屑：工作台 → 分组 → 当前页
 * @returns {{ label: string, view?: string, current?: boolean }[]}
 */
export function getBreadcrumb(view) {
  if (view === VIEWS.DASHBOARD) {
    return [{ label: getPageTitle(view), current: true }]
  }
  if (view === VIEWS.RECON_EDIT) {
    return [
      { label: '工作台', view: VIEWS.DASHBOARD },
      { label: '对账管理' },
      { label: getPageTitle(VIEWS.RECON_RD), view: VIEWS.RECON_RD },
      { label: getPageTitle(VIEWS.RECON_EDIT), current: true }
    ]
  }
  const group = SIDEBAR_GROUPS.find((g) => g.items.some((i) => i.view === view))
  const crumbs = [{ label: '工作台', view: VIEWS.DASHBOARD }]
  if (group && group.id !== 'workbench') {
    crumbs.push({ label: group.label })
  }
  crumbs.push({ label: getPageTitle(view), current: true })
  return crumbs
}
