-- 渠道对账：主表公共字段 + 游戏明细行（多游戏一单）
-- 执行前请备份。会将历史单行数据回填为一条 line item。

ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS partner_name TEXT;

CREATE TABLE IF NOT EXISTS channel_record_line_items (
    id TEXT PRIMARY KEY,
    channel_record_id TEXT NOT NULL REFERENCES channel_records (id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    game_name TEXT,
    billing_flow NUMERIC(18, 2) NOT NULL DEFAULT 0,
    voucher_cost NUMERIC(18, 2) NOT NULL DEFAULT 0,
    no_worry_cost NUMERIC(18, 2) NOT NULL DEFAULT 0,
    refund_cost NUMERIC(18, 2) NOT NULL DEFAULT 0,
    test_cost NUMERIC(18, 2) NOT NULL DEFAULT 0,
    welfare_cost NUMERIC(18, 2) NOT NULL DEFAULT 0,
    share_rate NUMERIC(10, 4) NOT NULL DEFAULT 0,
    billing_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    share_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(10, 4) NOT NULL DEFAULT 0,
    gateway_cost NUMERIC(18, 2) NOT NULL DEFAULT 0,
    settlement_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_channel_line_parent ON channel_record_line_items (channel_record_id);
CREATE INDEX IF NOT EXISTS idx_channel_line_game ON channel_record_line_items (game_name);

-- 历史数据：每条主表记录补一行明细（仅当尚无明细时）
INSERT INTO channel_record_line_items (
    id,
    channel_record_id,
    sort_order,
    game_name,
    billing_flow,
    voucher_cost,
    no_worry_cost,
    refund_cost,
    test_cost,
    welfare_cost,
    share_rate,
    billing_amount,
    share_amount,
    tax_rate,
    gateway_cost,
    settlement_amount
)
SELECT
    md5(random()::text || cr.id || clock_timestamp()::text),
    cr.id,
    0,
    cr.game_name,
    cr.billing_flow,
    cr.voucher_cost,
    cr.no_worry_cost,
    cr.refund_cost,
    cr.test_cost,
    cr.welfare_cost,
    cr.share_rate,
    cr.billing_amount,
    cr.share_amount,
    cr.tax_rate,
    cr.gateway_cost,
    cr.settlement_amount
FROM channel_records cr
WHERE NOT EXISTS (
    SELECT 1 FROM channel_record_line_items li WHERE li.channel_record_id = cr.id
);
