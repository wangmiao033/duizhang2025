-- 银行付款与研发对账关联（Neon / PostgreSQL）
-- 执行前请确保已存在 bank_transactions 表（010_create_bank_transactions.sql）

ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS reconciliation_id TEXT;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS reconciliation_type TEXT;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS reconciliation_no TEXT;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS linked_amount NUMERIC(18, 2);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_reconciliation_id
    ON bank_transactions (reconciliation_id)
    WHERE reconciliation_id IS NOT NULL;
