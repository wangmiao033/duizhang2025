# backend — 最小 FastAPI 服务（caiwuapi）

本目录位于 **单仓库 duizhang2025** 的 `backend/` 下，可 **独立安装依赖并运行**，不依赖前端构建产物。

## 本地启动

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# 编辑 .env，填写 Neon 等提供的 DATABASE_URL 以及认证相关变量
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Neon 控制台复制的连接串可直接填 `DATABASE_URL`（`postgresql://` 或 `postgres://` 均可）；应用会在内部转为 `postgresql+psycopg://`，以使用已安装的 **psycopg v3**（`psycopg[binary]`），无需改连接串、也无需安装 `psycopg2`。

- `GET /` → `{"ok": true, "service": "caiwuapi"}`
- `GET /health` → `{"ok": true}`
- `GET /health/db` → 数据库连通时 `{"ok": true, "database": "connected"}`，失败时含 `detail`

## 登录认证（验证码 + 密码）

- 新增认证接口：
  - `POST /api/auth/send-otp`
  - `POST /api/auth/login-otp`
  - `POST /api/auth/login-password`
  - `POST /api/auth/reset-password-otp`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- 管理员接口：
  - `GET /api/auth/users`
  - `POST /api/auth/users`
  - `PUT /api/auth/users/{id}/status`
  - `PUT /api/auth/users/{id}/reset-password`

### 初始化数据库

请在 Neon SQL Editor 执行：

```sql
-- 先执行 001~016
-- 再执行认证表
\i backend/sql/017_create_auth_tables.sql
```

默认会创建两个管理员账号：
- `caiwu@dxyx6888.com`
- `wangmiao@dxyx6888.com`

首次可通过验证码登录，再在系统内设置或重置密码。

## Koyeb 部署建议

| 项 | 值 |
|----|-----|
| Builder | Buildpack |
| Work directory | `backend` |
| Build command | `pip install -r requirements.txt` |
| Run command | 推荐使用仓库内 **`backend/Procfile`**（监听 **`$PORT`**，未设置时回退 `8000`）。亦可手动填写：`uvicorn app.main:app --host 0.0.0.0 --port $PORT`（勿使用 `main:app`，须为 **`app.main:app`**）。 |

将以下环境变量配置到 Koyeb（或 Secret）：

- `DATABASE_URL`
- `AUTH_JWT_SECRET`
- `AUTH_SESSION_HOURS`（建议 8）
- `AUTH_COOKIE_DOMAIN`（生产建议 `.hnchpower.cn`）
- `AUTH_COOKIE_SECURE`（生产 `true`）
- `AUTH_COOKIE_SAMESITE`（跨域前后端建议 `none`）
- `AUTH_OTP_SALT`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

依赖需包含 **`python-multipart`**（文件上传 `multipart/form-data`）。
