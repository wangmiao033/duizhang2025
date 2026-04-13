-- 研发对账：付款流水单（打款登记），一条对账记录对应一条（第一版）
-- Neon / PostgreSQL；执行前请确保 reconciliation_records 已存在。

CREATE TABLE IF NOT EXISTS bank_payment_records (
    id TEXT PRIMARY KEY,
    reconciliation_id TEXT NOT NULL UNIQUE REFERENCES reconciliation_records (id) ON DELETE CASCADE,
    transaction_serial TEXT,
    authorization_status TEXT,
    remittance_amount NUMERIC(18, 2) DEFAULT 0 NOT NULL,
    remittance_purpose TEXT,
    payment_remark TEXT,
    is_scheduled BOOLEAN DEFAULT FALSE NOT NULL,
    payment_date TEXT,
    transfer_status TEXT DEFAULT 'pending_submit' NOT NULL,
    remitter_company TEXT,
    remitter_account TEXT,
    remitter_bank_name TEXT,
    payee_company TEXT,
    payee_account TEXT,
    payee_bank_name TEXT,
    submitter_user_id TEXT,
    first_approver_user_id TEXT,
    first_approval_at TIMESTAMPTZ,
    bank_feedback TEXT,
    instruction_channel TEXT,
    is_personal_payee BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bank_payment_records_reconciliation_id
    ON bank_payment_records (reconciliation_id);
CREATE INDEX IF NOT EXISTS idx_bank_payment_records_transfer_status
    ON bank_payment_records (transfer_status);
