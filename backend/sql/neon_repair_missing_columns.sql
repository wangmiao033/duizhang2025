-- Neon：补齐 channel / invoice / payment 可能缺失的列（表须已存在）
-- 请先执行 backend/sql/002_create_channel_records.sql、003、004；若表已存在但缺列，再执行本脚本。
-- 不会删除多余列；删除旧列请用 005_payment_records_drop_legacy_columns.sql 等单独脚本。

-- ========== channel_records ==========
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS channel_name TEXT;
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS game_name TEXT;
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS settlement_month TEXT;
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS start_date TEXT;
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS end_date TEXT;
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS billing_flow NUMERIC(18, 2) DEFAULT 0 NOT NULL;
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS voucher_cost NUMERIC(18, 2) DEFAULT 0 NOT NULL;
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS no_worry_cost NUMERIC(18, 2) DEFAULT 0 NOT NULL;
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS refund_cost NUMERIC(18, 2) DEFAULT 0 NOT NULL;
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS test_cost NUMERIC(18, 2) DEFAULT 0 NOT NULL;
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS welfare_cost NUMERIC(18, 2) DEFAULT 0 NOT NULL;
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS share_rate NUMERIC(10, 4) DEFAULT 0 NOT NULL;
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS billing_amount NUMERIC(18, 2) DEFAULT 0 NOT NULL;
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS share_amount NUMERIC(18, 2) DEFAULT 0 NOT NULL;
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(10, 4) DEFAULT 0 NOT NULL;
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS gateway_cost NUMERIC(18, 2) DEFAULT 0 NOT NULL;
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS settlement_amount NUMERIC(18, 2) DEFAULT 0 NOT NULL;
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS remark TEXT;
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS server_cost NUMERIC(18, 2);
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS discount_type TEXT;
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS channel_fee_rate NUMERIC(10, 4);
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS dev_share_rate NUMERIC(10, 4);
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS profit_rate NUMERIC(10, 4);
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
ALTER TABLE channel_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- ========== invoice_records ==========
ALTER TABLE invoice_records ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE invoice_records ADD COLUMN IF NOT EXISTS tax_no TEXT;
ALTER TABLE invoice_records ADD COLUMN IF NOT EXISTS invoice_amount NUMERIC(18, 2) DEFAULT 0 NOT NULL;
ALTER TABLE invoice_records ADD COLUMN IF NOT EXISTS invoice_date TEXT;
ALTER TABLE invoice_records ADD COLUMN IF NOT EXISTS status TEXT DEFAULT '未开';
ALTER TABLE invoice_records ADD COLUMN IF NOT EXISTS remark TEXT;
ALTER TABLE invoice_records ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE invoice_records ADD COLUMN IF NOT EXISTS verified_amount NUMERIC(18, 2) DEFAULT 0 NOT NULL;
ALTER TABLE invoice_records ADD COLUMN IF NOT EXISTS verified_record_ids JSONB DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE invoice_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
ALTER TABLE invoice_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- ========== payment_records ==========
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS delivery_no TEXT;
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS recipient TEXT;
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS customer TEXT;
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS send_date TEXT;
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS status TEXT DEFAULT '待寄出';
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS remark TEXT;
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
