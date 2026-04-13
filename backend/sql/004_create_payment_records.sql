-- 回款登记（Neon / PostgreSQL）
-- 在 Neon 执行本文件创建 payment_records（与 ORM 字段一致）。

CREATE TABLE IF NOT EXISTS payment_records (
  id TEXT PRIMARY KEY,
  delivery_no TEXT,
  company TEXT,
  recipient TEXT,
  customer TEXT,
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
