-- 发票与回款关联表（Neon / PostgreSQL）
-- 在 Neon SQL Editor 中执行。若项目已有005_*.sql，本文件序号为 006。

CREATE TABLE IF NOT EXISTS invoice_payment_links (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  match_type TEXT DEFAULT 'manual',
  match_score NUMERIC(10, 4) DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_invoice_payment_links_pair UNIQUE (invoice_id, payment_id)
);

CREATE INDEX IF NOT EXISTS idx_invoice_payment_links_invoice_id ON invoice_payment_links (invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payment_links_payment_id ON invoice_payment_links (payment_id);
