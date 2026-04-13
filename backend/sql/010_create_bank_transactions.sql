-- 银行流水统一台账（流水导入 / 付款登记 / 回款登记）
-- Neon / PostgreSQL

CREATE TABLE IF NOT EXISTS bank_transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    trade_date TEXT,
    bank_account TEXT,
    payer_name TEXT,
    payer_account TEXT,
    payer_bank_name TEXT,
    payee_name TEXT,
    payee_account TEXT,
    payee_bank_name TEXT,
    amount NUMERIC(18, 2),
    income_amount NUMERIC(18, 2),
    expense_amount NUMERIC(18, 2),
    currency TEXT DEFAULT 'CNY',
    transaction_no TEXT,
    instruction_no TEXT,
    summary TEXT,
    purpose TEXT,
    remark TEXT,
    status TEXT,
    raw_text TEXT,
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_type ON bank_transactions (type);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_trade_date ON bank_transactions (trade_date);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_created_at ON bank_transactions (created_at DESC);
