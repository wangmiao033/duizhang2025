-- 渠道对账收款：明细表 + 主表汇总字段
-- 执行前请确认已存在 channel_records

ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS received_amount NUMERIC(18, 2) NOT NULL DEFAULT 0;

ALTER TABLE channel_records
    ADD COLUMN IF NOT EXISTS receipt_status VARCHAR(32) NOT NULL DEFAULT 'unpaid';

CREATE TABLE IF NOT EXISTS channel_receipts (
    id VARCHAR PRIMARY KEY,
    channel_record_id VARCHAR NOT NULL REFERENCES channel_records (id) ON DELETE CASCADE,
    amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    receipt_date VARCHAR(32),
    bank_account VARCHAR(512),
    remark TEXT,
    attachment_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_channel_receipts_channel_record_id
    ON channel_receipts (channel_record_id);

-- 老数据：received_amount / receipt_status 已由 DEFAULT 处理；可按明细表重算（迁移时明细为空则保持0 / unpaid）
