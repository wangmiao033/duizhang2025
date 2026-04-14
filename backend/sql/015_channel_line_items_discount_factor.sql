-- 渠道游戏明细：折扣系数（默认 1，空视为 1）
ALTER TABLE channel_record_line_items
    ADD COLUMN IF NOT EXISTS discount_factor NUMERIC(12, 6) NOT NULL DEFAULT 1;

UPDATE channel_record_line_items
SET discount_factor = 1
WHERE discount_factor IS NULL OR discount_factor <= 0;
