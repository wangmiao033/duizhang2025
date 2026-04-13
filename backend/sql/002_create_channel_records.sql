-- 渠道对账主表（Neon PostgreSQL）
-- 在 Neon 控制台 SQL Editor 或 psql 中执行。

CREATE TABLE IF NOT EXISTS channel_records (
    id TEXT PRIMARY KEY,
    channel_name TEXT,
    game_name TEXT,
    settlement_month TEXT,
    start_date TEXT,
    end_date TEXT,
    billing_flow NUMERIC(18, 2) DEFAULT 0 NOT NULL,
    voucher_cost NUMERIC(18, 2) DEFAULT 0 NOT NULL,
    no_worry_cost NUMERIC(18, 2) DEFAULT 0 NOT NULL,
    refund_cost NUMERIC(18, 2) DEFAULT 0 NOT NULL,
    test_cost NUMERIC(18, 2) DEFAULT 0 NOT NULL,
    welfare_cost NUMERIC(18, 2) DEFAULT 0 NOT NULL,
    share_rate NUMERIC(10, 4) DEFAULT 0 NOT NULL,
    billing_amount NUMERIC(18, 2) DEFAULT 0 NOT NULL,
    share_amount NUMERIC(18, 2) DEFAULT 0 NOT NULL,
    tax_rate NUMERIC(10, 4) DEFAULT 0 NOT NULL,
    gateway_cost NUMERIC(18, 2) DEFAULT 0 NOT NULL,
    settlement_amount NUMERIC(18, 2) DEFAULT 0 NOT NULL,
    status TEXT DEFAULT 'pending',
    remark TEXT,
    server_cost NUMERIC(18, 2),
    discount_type TEXT,
    channel_fee_rate NUMERIC(10, 4),
    dev_share_rate NUMERIC(10, 4),
    profit_rate NUMERIC(10, 4),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_channel_records_settlement_month ON channel_records (settlement_month);
CREATE INDEX IF NOT EXISTS idx_channel_records_channel_name ON channel_records (channel_name);
CREATE INDEX IF NOT EXISTS idx_channel_records_game_name ON channel_records (game_name);
CREATE INDEX IF NOT EXISTS idx_channel_records_status ON channel_records (status);
CREATE INDEX IF NOT EXISTS idx_channel_records_start_date ON channel_records (start_date);
