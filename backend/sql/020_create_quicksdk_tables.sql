-- QuickSDK 流水库：导入批次 + 流水明细
-- 在 Neon SQL Editor 中执行；可重复执行（幂等）

CREATE TABLE IF NOT EXISTS quicksdk_import_batches (
  id TEXT PRIMARY KEY,
  source_file TEXT,
  settlement_month TEXT,
  row_count INTEGER NOT NULL DEFAULT 0,
  game_count INTEGER NOT NULL DEFAULT 0,
  channel_count INTEGER NOT NULL DEFAULT 0,
  total_flow NUMERIC(18, 2) NOT NULL DEFAULT 0,
  note TEXT,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quicksdk_batches_month
  ON quicksdk_import_batches (settlement_month);

CREATE INDEX IF NOT EXISTS idx_quicksdk_batches_imported_at
  ON quicksdk_import_batches (imported_at DESC);

CREATE TABLE IF NOT EXISTS quicksdk_flows (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES quicksdk_import_batches (id) ON DELETE CASCADE,
  flow_date TEXT,
  settlement_month TEXT,
  game_name TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  gross_flow NUMERIC(18, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quicksdk_flows_batch
  ON quicksdk_flows (batch_id);

CREATE INDEX IF NOT EXISTS idx_quicksdk_flows_month
  ON quicksdk_flows (settlement_month);

CREATE INDEX IF NOT EXISTS idx_quicksdk_flows_game
  ON quicksdk_flows (game_name);

CREATE INDEX IF NOT EXISTS idx_quicksdk_flows_channel
  ON quicksdk_flows (channel_name);

CREATE INDEX IF NOT EXISTS idx_quicksdk_flows_month_game
  ON quicksdk_flows (settlement_month, game_name);
