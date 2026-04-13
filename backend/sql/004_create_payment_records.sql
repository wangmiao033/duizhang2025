-- 回款登记 / 快递寄送台账（Neon / PostgreSQL）
-- 在 Neon SQL Editor 中执行本文件以创建 payment_records 表。
-- 核心列与需求一致；另含 recipient_phone、address、partner_id、expected_date，与 deliveryForm.js 表单对齐。

CREATE TABLE IF NOT EXISTS payment_records (
  id TEXT PRIMARY KEY,
  delivery_no TEXT,
  company TEXT,
  recipient TEXT,
  recipient_phone TEXT,
  address TEXT,
  partner_id TEXT,
  customer TEXT,
  expected_date TEXT,
  send_date TEXT,
  status TEXT DEFAULT '待寄出',
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_records_delivery_no ON payment_records (delivery_no);
CREATE INDEX IF NOT EXISTS idx_payment_records_company ON payment_records (company);
CREATE INDEX IF NOT EXISTS idx_payment_records_customer ON payment_records (customer);
CREATE INDEX IF NOT EXISTS idx_payment_records_send_date ON payment_records (send_date);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records (status);
