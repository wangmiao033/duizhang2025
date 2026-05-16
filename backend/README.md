# backend - FastAPI service

本目录位于单仓库 `duizhang2025` 的 `backend/` 下，可独立安装依赖并运行，不依赖前端构建产物。

## 本地启动

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# 编辑 .env，填写 PostgreSQL 的 DATABASE_URL 以及认证相关变量
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

PostgreSQL 连接串可直接填 `DATABASE_URL`（`postgresql://` 或 `postgres://` 均可）。应用会在内部转为 `postgresql+psycopg://`，以使用已安装的 `psycopg[binary]`。

- `GET /` -> `{"ok": true, "service": "caiwuapi"}`
- `GET /health` -> `{"ok": true}`
- `GET /health/db` -> 数据库连通时返回 `{"ok": true, "database": "connected"}`

## 登录认证

当前只保留账号密码登录：

- `POST /api/auth/login-password`
- `POST /api/auth/logout`
- `GET /api/auth/me`

管理员接口：

- `GET /api/auth/users`
- `POST /api/auth/users`
- `PUT /api/auth/users/{id}/status`
- `PUT /api/auth/users/{id}/reset-password`

内置管理员账号由环境变量控制：

- `AUTH_BUILTIN_ACCOUNT`，默认 `adam`
- `AUTH_BUILTIN_PASSWORDS`，默认 `911030.,adam123`

## 初始化数据库

请在 PostgreSQL 中执行：

```sql
-- 先执行 001~016
-- 再执行认证表
\i backend/sql/017_create_auth_tables.sql
```

## 生产部署变量

- `DATABASE_URL`
- `AUTH_JWT_SECRET`
- `AUTH_SESSION_HOURS`（建议 24）
- `AUTH_COOKIE_DOMAIN`（生产建议 `.hnchpower.cn`）
- `AUTH_COOKIE_SECURE`（生产 `true`）
- `AUTH_COOKIE_SAMESITE`（同域部署建议 `lax`）
- `AUTH_BUILTIN_ACCOUNT`
- `AUTH_BUILTIN_PASSWORDS`

依赖需包含 `python-multipart`（文件上传 `multipart/form-data`）。
