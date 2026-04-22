-- 认证系统：用户、验证码、会话（Neon / PostgreSQL）
-- 在 Neon SQL Editor 中执行。建议在 001~016 后执行。

CREATE TABLE IF NOT EXISTS auth_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  password_hash TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users (email);

CREATE TABLE IF NOT EXISTS auth_otp_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth_users (id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  request_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_otp_codes_user_id ON auth_otp_codes (user_id);
CREATE INDEX IF NOT EXISTS idx_auth_otp_codes_created_at ON auth_otp_codes (created_at);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth_users (id) ON DELETE CASCADE,
  token_jti TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions (expires_at);

-- 初始账户（可重复执行，按 email 幂等）
INSERT INTO auth_users (id, email, display_name, role, is_active)
VALUES
  ('auth-user-caiwu', 'caiwu@dxyx6888.com', '财务账号', 'admin', TRUE),
  ('auth-user-wangmiao', 'wangmiao@dxyx6888.com', '王淼', 'admin', TRUE)
ON CONFLICT (email) DO UPDATE
SET display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;
