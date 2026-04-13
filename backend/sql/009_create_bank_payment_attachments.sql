-- 付款流水单附件（回单截图 / PDF）
-- 依赖 bank_payment_records；ON DELETE CASCADE 随付款单删除。

CREATE TABLE IF NOT EXISTS bank_payment_attachments (
    id TEXT PRIMARY KEY,
    bank_payment_id TEXT NOT NULL REFERENCES bank_payment_records (id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bank_payment_attachments_bank_payment_id
    ON bank_payment_attachments (bank_payment_id);
