-- 研发对账主表（Neon PostgreSQL）
-- 在 Neon 控制台 SQL Editor 或 psql 中执行本文件。

CREATE TABLE IF NOT EXISTS reconciliation_records (
 id TEXT PRIMARY KEY,
    statement_no TEXT NOT NULL UNIQUE,
    settlement_month TEXT,
    partner_name TEXT,
    game_name TEXT,
    game_flow NUMERIC(18, 2) DEFAULT 0 NOT NULL,
    test_cost NUMERIC(18, 2) DEFAULT 0 NOT NULL,
    voucher_cost NUMERIC(18, 2) DEFAULT 0 NOT NULL,
    channel_fee_rate NUMERIC(10, 4) DEFAULT 0 NOT NULL,
    tax_rate NUMERIC(10, 4) DEFAULT 0 NOT NULL,
    revenue_share_rate NUMERIC(10, 4) DEFAULT 0 NOT NULL,
    discount_value NUMERIC(18, 6) DEFAULT 1 NOT NULL,
    refund_amount NUMERIC(18, 2) DEFAULT 0 NOT NULL,
    settlement_amount NUMERIC(18, 2) DEFAULT 0 NOT NULL,
    status TEXT DEFAULT 'pending',
    remark TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_records_settlement_month
    ON reconciliation_records (settlement_month);
CREATE INDEX IF NOT EXISTS idx_reconciliation_records_partner_name
    ON reconciliation_records (partner_name);
CREATE INDEX IF NOT EXISTS idx_reconciliation_records_game_name
    ON reconciliation_records (game_name);
CREATE INDEX IF NOT EXISTS idx_reconciliation_records_status
    ON reconciliation_records (status);
