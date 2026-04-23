-- 合同管理：合同台账
CREATE TABLE IF NOT EXISTS contract_records (
  id TEXT PRIMARY KEY,
  signing_date TEXT NULL,
  channel TEXT NULL,
  platform TEXT NULL,
  address TEXT NULL,
  valid_period TEXT NULL,
  game TEXT NULL,
  channel_share TEXT NULL,
  issue_share TEXT NULL,
  channel_fee TEXT NULL,
  remark TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_records_created_at ON contract_records (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contract_records_channel ON contract_records (channel);
