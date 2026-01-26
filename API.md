# API 文档

## 数据格式

### 对账记录 (Reconciliation Record)

```typescript
interface ReconciliationRecord {
  id: number                    // 记录ID（时间戳）
  settlementMonth: string       // 结算月份（如：2025年9月）
  partner: string              // 合作方名称
  game: string                 // 游戏名称
  gameFlow: number             // 游戏流水
  testingFee: number          // 测试费
  voucher: number              // 代金券
  channelFeeRate: number      // 通道费率（百分比）
  taxPoint: number             // 税点（百分比）
  revenueShareRatio: number    // 分成比例（百分比）
  discount: number             // 折扣
  refund: number              // 退款
  settlementAmount: string     // 结算金额（自动计算）
}
```

### 发票记录 (Invoice Record)

```typescript
interface InvoiceRecord {
  id: number                   // 发票ID（时间戳）
  title: string               // 发票抬头
  taxNo: string               // 税号
  amount: string              // 开票金额
  status: string              // 状态：'未开' | '已开' | '作废'
  issueDate: string           // 开票日期（YYYY-MM-DD格式）
  remark: string             // 备注
  verified?: boolean          // 是否已核销
  verifiedRecordIds?: number[] // 关联的对账记录ID数组
}
```

### 客户信息 (Partner)

```typescript
interface Partner {
  id: number                  // 客户ID
  name: string                // 客户名称
  category: string            // 类别
  tag2: string               // 标签2
  invoiceContent?: string     // 发票内容
  createdAt: string           // 创建时间（ISO格式）
}
```

### 快递记录 (Delivery)

```typescript
interface Delivery {
  id: number                  // 快递ID
  partnerId?: number          // 关联客户ID
  trackingNumber: string     // 快递单号
  company: string            // 快递公司
  status: string             // 状态
  date: string               // 日期
  note?: string              // 备注
}
```

## 计算公式

### 结算金额计算

```
结算金额 = (游戏流水 - 测试费 - 代金券) 
         × (1 - 通道费率) 
         × (1 - 税点) 
         × 分成比例 
         × 折扣 
         - 退款

最终金额 = Math.max(0, 结算金额)
```

## 数据存储

### LocalStorage Keys

- `reconciliationRecords` - 对账记录数组
- `invoiceRecords` - 发票记录数组
- `partners` - 客户信息数组
- `deliveries` - 快递记录数组
- `channelRecords` - 渠道对账记录数组
- `partyA` - 甲方信息对象
- `partyB` - 乙方信息对象
- `settlementMonth` - 当前结算月份

### 数据格式示例

```json
{
  "reconciliationRecords": [
    {
      "id": 1706256000000,
      "settlementMonth": "2025年9月",
      "partner": "广州能动科技有限公司",
      "game": "游戏A",
      "gameFlow": "100000",
      "testingFee": "1000",
      "voucher": "500",
      "channelFeeRate": "3",
      "taxPoint": "6",
      "revenueShareRatio": "50",
      "discount": "1",
      "refund": "0",
      "settlementAmount": "42500.00"
    }
  ],
  "invoiceRecords": [
    {
      "id": 1706256000001,
      "title": "广州熊动科技有限公司",
      "taxNo": "91440104MABURPOXXA",
      "amount": "22557.99",
      "status": "已开",
      "issueDate": "2026-01-26",
      "remark": "销售方：深圳龙魂",
      "verified": true,
      "verifiedRecordIds": [1706256000000]
    }
  ]
}
```

## 导出格式

### Excel导出格式

包含以下工作表：
1. **对账记录** - 所有对账记录
2. **汇总信息** - 统计数据汇总
3. **公司信息** - 甲方和乙方信息

### CSV导出格式

- UTF-8编码（带BOM）
- 逗号分隔
- 第一行为表头

### JSON导出格式

- 标准JSON格式
- 包含所有数据
- 可用于数据备份和恢复

## 文件名解析规则

### PDF发票文件名格式

```
销售方+购买方+金额+日期.pdf
```

**示例：**
```
深圳龙魂+广州熊动22557.99+20260126.pdf
```

**解析结果：**
- 销售方：深圳龙魂
- 购买方（发票抬头）：广州熊动
- 金额：22557.99
- 日期：2026-01-26（自动转换为YYYY-MM-DD格式）
- 状态：已开（自动设置）
- 备注：销售方：深圳龙魂（自动设置）

## 快捷键API

### 支持的快捷键

```javascript
{
  'ctrl+f': () => {
    // 聚焦搜索框
    document.querySelector('.search-input')?.focus()
  },
  'ctrl+p': () => {
    // 触发打印
    window.print()
  },
  'ctrl+enter': () => {
    // 保存编辑（在编辑模式下）
    // 由DataTable组件内部处理
  }
}
```

## 组件API

### DataTable Props

```typescript
interface DataTableProps {
  records: ReconciliationRecord[]
  onUpdateRecord: (id: number, record: ReconciliationRecord) => void
  onDeleteRecord: (id: number) => void
  calculateSettlementAmount: (record: ReconciliationRecord) => number
  onUpdateSuccess?: () => void
  selectedIds?: number[]
  onSelectAll?: (checked: boolean) => void
  onSelectRecord?: (id: number, checked: boolean) => void
  onBatchDelete?: () => void
  onCopyRecord?: (record: ReconciliationRecord) => void
  onReorder?: (records: ReconciliationRecord[]) => void
}
```

### Invoice Verification API

```typescript
interface VerificationDialogProps {
  invoice: InvoiceRecord
  records: ReconciliationRecord[]
  onConfirm: (invoiceId: number, recordIds: number[]) => void
  onCancel: () => void
}
```

## 错误处理

### 常见错误

1. **数据格式错误**
   - 错误：导入的JSON格式不正确
   - 处理：显示错误提示，不导入数据

2. **文件名解析失败**
   - 错误：PDF文件名格式不符合要求
   - 处理：提示用户手动录入

3. **数据验证失败**
   - 错误：必填字段为空
   - 处理：显示验证错误，阻止保存

## 性能优化

### 数据缓存

- 使用 `useMemo` 缓存计算结果
- 使用 `useCallback` 缓存函数引用
- 使用 `React.memo` 优化组件渲染

### 数据分页

- 大量数据时建议使用筛选功能
- 支持按条件筛选减少显示数据量

---

**最后更新：** 2026年1月26日
