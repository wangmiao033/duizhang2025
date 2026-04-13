-- 异常中心 2.0：处理状态多端同步（Neon / PostgreSQL）
-- 在 Neon SQL Editor 中执行。

CREATE TABLE IF NOT EXISTS exception_statuses (
  id TEXT PRIMARY KEY,
  exception_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_exception_statuses_exception_id UNIQUE (exception_id),
  CONSTRAINT ck_exception_statuses_status CHECK (status IN ('pending', 'ignored', 'resolved'))
);

CREATE INDEX IF NOT EXISTS idx_exception_statuses_exception_id ON exception_statuses (exception_id);
