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
  /** 渠道对账：完整新增（独立页） */
  CHANNEL_RECON_CREATE: 'channel-recon-create',
  /** 渠道对账：完整编辑（独立页） */
  CHANNEL_RECON_EDIT: 'channel-recon-edit',
  RECON_MASTER: 'recon-master',
  RECON_EXCEPTIONS: 'recon-exceptions',
  /** 本地备份 / 导入导出 JSON（DataBackup） */
  DATA_BACKUP_RESTORE: 'data-backup-restore',
  SETTLE_MONTHLY: 'settle-monthly',
  SETTLE_CHANNEL: 'settle-channel',
  SETTLE_STATUS: 'settle-status',
  INVOICE_OUTPUT: 'invoice-output',
  INVOICE_INPUT: 'invoice-input',
  INVOICE_MANAGE: 'invoice-manage',
  INVOICE_VERIFY: 'invoice-verify',
  INVOICE_PAYMENT: 'invoice-payment',
  INVOICE_CREATE: 'invoice-create',
  INVOICE_EDIT: 'invoice-edit',
  PAYMENT_CREATE: 'payment-create',
  PAYMENT_EDIT: 'payment-edit',
  PARTNER_CONTACTS: 'partner-contacts',
  PARTNER_GAMES: 'partner-games',
  PARTNER_COMPANY: 'partner-company',
  CONTRACT_MANAGEMENT: 'contract-management',
  REPORTS_IMPORT: 'reports-import',
  REPORTS_EXPORT: 'reports-export',
  REPORTS_STATS: 'reports-stats',
  REPORTS_PROFIT: 'reports-profit',
  SETTINGS_TAGS: 'settings-tags',
  SETTINGS_HISTORY: 'settings-history',
  SETTINGS_BACKUP: 'settings-backup',
  SETTINGS_APP: 'settings-app',
  AUTH_USERS: 'auth-users',
  /** 非侧边栏入口：快捷操作等 */
  SETTINGS_REMINDERS: 'settings-reminders',
  /** 银行对账（独立模块） */
  BANK_TRANSACTIONS_LEDGER: 'bank-transactions-ledger',
  BANK_STATEMENT_IMPORT: 'bank-statement-import',
  BANK_PAYMENT_REGISTER: 'bank-payment-register',
  BANK_COLLECTION_REGISTER: 'bank-collection-register'
}

export const SIDEBAR_GROUPS = [
  {
    id: 'workbench',
    label: '常用',
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
    id: 'bank-recon',
    label: '银行对账',
    items: [
      { view: VIEWS.BANK_TRANSACTIONS_LEDGER, label: '银行流水表' },
      { view: VIEWS.BANK_STATEMENT_IMPORT, label: '银行流水导入' },
      { view: VIEWS.BANK_COLLECTION_REGISTER, label: '银行回款登记' },
      { view: VIEWS.BANK_PAYMENT_REGISTER, label: '研发对账付款确认' }
    ]
  },
  {
    id: 'invoice',
    label: '发票管理',
    items: [
      { view: VIEWS.INVOICE_OUTPUT, label: '销项发票' },
      { view: VIEWS.INVOICE_INPUT, label: '进项发票' },
      { view: VIEWS.INVOICE_PAYMENT, label: '回款登记' },
      { view: VIEWS.PAYMENT_CREATE, label: '新增回款登记' }
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
    id: 'contract',
    label: '合同管理',
    items: [{ view: VIEWS.CONTRACT_MANAGEMENT, label: '合同管理' }]
  },
  {
    id: 'system',
    label: '系统设置',
    items: [
      { view: VIEWS.SETTINGS_TAGS, label: '标签管理' },
      { view: VIEWS.SETTINGS_HISTORY, label: '历史记录' },
      { view: VIEWS.SETTINGS_BACKUP, label: '数据备份' },
      { view: VIEWS.SETTINGS_APP, label: '系统设置' },
      { view: VIEWS.AUTH_USERS, label: '账号管理' }
    ]
  }
]

const VIEW_TITLES = {
  [VIEWS.DASHBOARD]: '工作台',
  [VIEWS.RECON_RD]: '研发对账',
  [VIEWS.RECON_CREATE]: '新增研发对账记录',
  [VIEWS.RECON_EDIT]: '编辑研发对账记录',
  [VIEWS.RECON_CHANNEL]: '渠道对账',
  [VIEWS.CHANNEL_RECON_CREATE]: '新增渠道对账记录',
  [VIEWS.CHANNEL_RECON_EDIT]: '编辑渠道对账记录',
  [VIEWS.RECON_MASTER]: '对账总表',
  [VIEWS.RECON_EXCEPTIONS]: '异常中心',
  [VIEWS.DATA_BACKUP_RESTORE]: '备份恢复',
  [VIEWS.SETTLE_MONTHLY]: '月度结算单',
  [VIEWS.SETTLE_CHANNEL]: '渠道结算单',
  [VIEWS.SETTLE_STATUS]: '结算状态',
  [VIEWS.INVOICE_OUTPUT]: '销项发票',
  [VIEWS.INVOICE_INPUT]: '进项发票',
  [VIEWS.INVOICE_MANAGE]: '发票管理',
  [VIEWS.INVOICE_CREATE]: '新增发票',
  [VIEWS.INVOICE_EDIT]: '编辑发票',
  [VIEWS.INVOICE_VERIFY]: '发票核销',
  [VIEWS.INVOICE_PAYMENT]: '回款登记',
  [VIEWS.PAYMENT_CREATE]: '新增回款登记',
  [VIEWS.PAYMENT_EDIT]: '编辑回款登记',
  [VIEWS.PARTNER_CONTACTS]: '合作方管理',
  [VIEWS.PARTNER_GAMES]: '游戏管理',
  [VIEWS.PARTNER_COMPANY]: '公司信息',
  [VIEWS.CONTRACT_MANAGEMENT]: '合同管理',
  [VIEWS.REPORTS_IMPORT]: 'Excel导入',
  [VIEWS.REPORTS_EXPORT]: '导出中心',
  [VIEWS.REPORTS_STATS]: '统计分析',
  [VIEWS.REPORTS_PROFIT]: '利润分析',
  [VIEWS.SETTINGS_TAGS]: '标签管理',
  [VIEWS.SETTINGS_HISTORY]: '历史记录',
  [VIEWS.SETTINGS_BACKUP]: '数据备份',
  [VIEWS.SETTINGS_APP]: '系统设置',
  [VIEWS.AUTH_USERS]: '账号管理',
  [VIEWS.SETTINGS_REMINDERS]: '提醒事项',
  [VIEWS.BANK_TRANSACTIONS_LEDGER]: '银行流水表',
  [VIEWS.BANK_STATEMENT_IMPORT]: '银行流水导入',
  [VIEWS.BANK_PAYMENT_REGISTER]: '研发对账付款确认',
  [VIEWS.BANK_COLLECTION_REGISTER]: '银行回款登记'
}

export function getPageTitle(view) {
  return VIEW_TITLES[view] || '对账管理系统'
}

/** 页面副标题 / 说明（顶栏与页头共用） */
const VIEW_DESCRIPTIONS = {
  [VIEWS.DASHBOARD]: '快捷入口、待办与常用工具总览',
  [VIEWS.RECON_RD]: '研发侧对账记录、筛选、统计、导出与新增入口',
  [VIEWS.RECON_CREATE]: '从研发对账进入的完整录入页，与编辑页共用同一套 DataForm 与校验',
  [VIEWS.RECON_EDIT]: '完整编辑已有记录；保存后返回研发对账列表',
  [VIEWS.RECON_CHANNEL]: '渠道对账数据维护、核对、导入导出与新增入口',
  [VIEWS.CHANNEL_RECON_CREATE]: '从渠道对账进入的完整录入页，与编辑页共用 ChannelBillingForm',
  [VIEWS.CHANNEL_RECON_EDIT]: '完整编辑已有渠道记录；保存后返回渠道对账列表',
  [VIEWS.RECON_MASTER]: '按当前筛选查看全部对账记录（与研发对账共用数据）',
  [VIEWS.RECON_EXCEPTIONS]: '数据诊断、恢复入口与校验异常集中处理',
  [VIEWS.DATA_BACKUP_RESTORE]: '本地备份、JSON 导入导出与备份历史',
  [VIEWS.SETTLE_MONTHLY]: '月度结算单生成与查看',
  [VIEWS.SETTLE_CHANNEL]: '渠道维度结算',
  [VIEWS.SETTLE_STATUS]: '结算进度与状态跟踪',
  [VIEWS.INVOICE_OUTPUT]: '销项发票开具与台账',
  [VIEWS.INVOICE_INPUT]: '进项发票接收与台账',
  [VIEWS.INVOICE_MANAGE]: '发票开具与台账',
  [VIEWS.INVOICE_CREATE]: '完整录入发票，与编辑页共用表单与校验',
  [VIEWS.INVOICE_EDIT]: '完整编辑发票；保存后返回发票管理',
  [VIEWS.INVOICE_VERIFY]: '发票核销与勾稽',
  [VIEWS.INVOICE_PAYMENT]: '回款登记与流水',
  [VIEWS.PAYMENT_CREATE]: '完整录入回款/寄送登记',
  [VIEWS.PAYMENT_EDIT]: '完整编辑回款登记；保存后返回列表',
  [VIEWS.PARTNER_CONTACTS]: '合作方联系人维护',
  [VIEWS.PARTNER_GAMES]: '游戏/项目主数据',
  [VIEWS.PARTNER_COMPANY]: '本公司信息',
  [VIEWS.CONTRACT_MANAGEMENT]: '渠道、平台方与分成比例的合同台账',
  [VIEWS.REPORTS_IMPORT]: 'Excel 批量导入',
  [VIEWS.REPORTS_EXPORT]: '导出任务与下载',
  [VIEWS.REPORTS_STATS]: '统计图表与汇总',
  [VIEWS.REPORTS_PROFIT]: '利润与毛利分析',
  [VIEWS.SETTINGS_TAGS]: '业务标签与分类',
  [VIEWS.SETTINGS_HISTORY]: '系统内历史记录',
  [VIEWS.SETTINGS_BACKUP]: '数据备份选项',
  [VIEWS.SETTINGS_APP]: '主题、格式与默认参数',
  [VIEWS.AUTH_USERS]: '登录账号、角色与状态管理',
  [VIEWS.SETTINGS_REMINDERS]: '提醒与待办配置',
  [VIEWS.BANK_TRANSACTIONS_LEDGER]: '流水导入、付款登记、回款登记的统一台账与筛选',
  [VIEWS.BANK_STATEMENT_IMPORT]: '录入或粘贴单条流水，保存后写入服务端统一台账',
  [VIEWS.BANK_PAYMENT_REGISTER]: '关联研发对账、确认付款信息并上传回单，提交后写入付款登记台账',
  [VIEWS.BANK_COLLECTION_REGISTER]: '登记渠道/项目回款，保存后写入服务端统一台账'
}

/** 侧栏与导航图标（纯文本符号，无额外依赖） */
export const VIEW_ICONS = {
  [VIEWS.DASHBOARD]: '台',
  [VIEWS.RECON_RD]: '研',
  [VIEWS.RECON_CREATE]: '增',
  [VIEWS.RECON_EDIT]: '改',
  [VIEWS.RECON_CHANNEL]: '渠',
  [VIEWS.CHANNEL_RECON_CREATE]: '增',
  [VIEWS.CHANNEL_RECON_EDIT]: '改',
  [VIEWS.RECON_MASTER]: '总',
  [VIEWS.RECON_EXCEPTIONS]: '异',
  [VIEWS.DATA_BACKUP_RESTORE]: '备',
  [VIEWS.SETTLE_MONTHLY]: '月',
  [VIEWS.SETTLE_CHANNEL]: '结',
  [VIEWS.SETTLE_STATUS]: '态',
  [VIEWS.INVOICE_OUTPUT]: '销',
  [VIEWS.INVOICE_INPUT]: '进',
  [VIEWS.INVOICE_MANAGE]: '票',
  [VIEWS.INVOICE_CREATE]: '增',
  [VIEWS.INVOICE_EDIT]: '改',
  [VIEWS.INVOICE_VERIFY]: '核',
  [VIEWS.INVOICE_PAYMENT]: '款',
  [VIEWS.PAYMENT_CREATE]: '增',
  [VIEWS.PAYMENT_EDIT]: '改',
  [VIEWS.PARTNER_CONTACTS]: '人',
  [VIEWS.PARTNER_GAMES]: '游',
  [VIEWS.PARTNER_COMPANY]: '司',
  [VIEWS.CONTRACT_MANAGEMENT]: '合',
  [VIEWS.REPORTS_IMPORT]: '导',
  [VIEWS.REPORTS_EXPORT]: '出',
  [VIEWS.REPORTS_STATS]: '析',
  [VIEWS.REPORTS_PROFIT]: '利',
  [VIEWS.SETTINGS_TAGS]: '签',
  [VIEWS.SETTINGS_HISTORY]: '志',
  [VIEWS.SETTINGS_BACKUP]: '档',
  [VIEWS.SETTINGS_APP]: '设',
  [VIEWS.AUTH_USERS]: '账',
  [VIEWS.SETTINGS_REMINDERS]: '铃',
  [VIEWS.BANK_TRANSACTIONS_LEDGER]: '账',
  [VIEWS.BANK_STATEMENT_IMPORT]: '流',
  [VIEWS.BANK_PAYMENT_REGISTER]: '付',
  [VIEWS.BANK_COLLECTION_REGISTER]: '回'
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
  if (view === VIEWS.RECON_CREATE) {
    return [
      { label: '工作台', view: VIEWS.DASHBOARD },
      { label: '对账管理' },
      { label: getPageTitle(VIEWS.RECON_RD), view: VIEWS.RECON_RD },
      { label: getPageTitle(VIEWS.RECON_CREATE), current: true }
    ]
  }
  if (view === VIEWS.RECON_EDIT) {
    return [
      { label: '工作台', view: VIEWS.DASHBOARD },
      { label: '对账管理' },
      { label: getPageTitle(VIEWS.RECON_RD), view: VIEWS.RECON_RD },
      { label: getPageTitle(VIEWS.RECON_EDIT), current: true }
    ]
  }
  if (view === VIEWS.CHANNEL_RECON_CREATE) {
    return [
      { label: '工作台', view: VIEWS.DASHBOARD },
      { label: '对账管理' },
      { label: getPageTitle(VIEWS.RECON_CHANNEL), view: VIEWS.RECON_CHANNEL },
      { label: getPageTitle(VIEWS.CHANNEL_RECON_CREATE), current: true }
    ]
  }
  if (view === VIEWS.CHANNEL_RECON_EDIT) {
    return [
      { label: '工作台', view: VIEWS.DASHBOARD },
      { label: '对账管理' },
      { label: getPageTitle(VIEWS.RECON_CHANNEL), view: VIEWS.RECON_CHANNEL },
      { label: getPageTitle(VIEWS.CHANNEL_RECON_EDIT), current: true }
    ]
  }
  if (view === VIEWS.INVOICE_EDIT) {
    return [
      { label: '工作台', view: VIEWS.DASHBOARD },
      { label: '发票管理' },
      { label: getPageTitle(VIEWS.INVOICE_OUTPUT), view: VIEWS.INVOICE_OUTPUT },
      { label: getPageTitle(VIEWS.INVOICE_EDIT), current: true }
    ]
  }
  if (view === VIEWS.PAYMENT_EDIT) {
    return [
      { label: '工作台', view: VIEWS.DASHBOARD },
      { label: '发票管理' },
      { label: getPageTitle(VIEWS.INVOICE_PAYMENT), view: VIEWS.INVOICE_PAYMENT },
      { label: getPageTitle(VIEWS.PAYMENT_EDIT), current: true }
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
