-- 研发对账明细补字段：结算周期（用于保留每行实际结算月份）
-- 在 Neon SQL Editor 执行；可重复执行（幂等）

ALTER TABLE reconciliation_line_items
ADD COLUMN IF NOT EXISTS settlement_cycle TEXT;

-- 历史数据回填：若明细未存结算周期，使用主单结算月份兜底
UPDATE reconciliation_line_items li
SET settlement_cycle = r.settlement_month
FROM reconciliation_records r
WHERE li.reconciliation_id = r.id
  AND (li.settlement_cycle IS NULL OR btrim(li.settlement_cycle) = '');
