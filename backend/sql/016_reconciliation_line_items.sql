-- 研发对账：多游戏明细行（与 channel_record_line_items 结构思路一致）
CREATE TABLE IF NOT EXISTS reconciliation_line_items (
    id TEXT PRIMARY KEY,
    reconciliation_id TEXT NOT NULL REFERENCES reconciliation_records (id) ON DELETE CASCADE,
    settlement_cycle TEXT,
    game_name TEXT,
    revenue NUMERIC(18, 2) DEFAULT 0 NOT NULL,
    discount_rate NUMERIC(18, 6) DEFAULT 1 NOT NULL,
    net_revenue NUMERIC(18, 2) DEFAULT 0 NOT NULL,
    coupon_amount NUMERIC(18, 2) DEFAULT 0 NOT NULL,
    test_fee NUMERIC(18, 2) DEFAULT 0 NOT NULL,
    extra_fee NUMERIC(18, 2) DEFAULT 0 NOT NULL,
    share_ratio NUMERIC(10, 4) DEFAULT 0 NOT NULL,
    tax_rate NUMERIC(10, 4) DEFAULT 0 NOT NULL,
    share_amount NUMERIC(18, 2) DEFAULT 0 NOT NULL,
    settlement_amount NUMERIC(18, 2) DEFAULT 0 NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_line_items_reconciliation_id
    ON reconciliation_line_items (reconciliation_id);
