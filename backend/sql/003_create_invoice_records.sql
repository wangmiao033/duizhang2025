-- 发票管理台账（Neon / PostgreSQL）
-- 在 Neon SQL Editor 中执行本文件以创建 invoice_records 表。

CREATE TABLE IF NOT EXISTS invoice_records (
  id TEXT PRIMARY KEY,
  title TEXT,
  tax_no TEXT,
  invoice_amount NUMERIC(18, 2) DEFAULT 0 NOT NULL,
  invoice_date TEXT,
  status TEXT DEFAULT '未开',
  remark TEXT,
  verified BOOLEAN DEFAULT FALSE NOT NULL,
  verified_amount NUMERIC(18, 2) DEFAULT 0 NOT NULL,
  verified_record_ids JSONB DEFAULT '[]'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invoice_records_title ON invoice_records (title);
CREATE INDEX IF NOT EXISTS idx_invoice_records_tax_no ON invoice_records (tax_no);
CREATE INDEX IF NOT EXISTS idx_invoice_records_invoice_date ON invoice_records (invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoice_records_status ON invoice_records (status);
