# backend — 最小 FastAPI 服务（caiwuapi）

本目录位于 **单仓库 duizhang2025** 的 `backend/` 下，可 **独立安装依赖并运行**，不依赖前端构建产物。业务 CRUD 与表结构将在后续迭代接入；当前仅提供根路径与健康检查（含数据库探测）。

## 本地启动

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# 编辑 .env，填写 Neon 等提供的 DATABASE_URL
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- `GET /` → `{"ok": true, "service": "caiwuapi"}`
- `GET /health` → `{"ok": true}`
- `GET /health/db` → 数据库连通时 `{"ok": true, "database": "connected"}`，失败时含 `detail`

## Koyeb 部署建议

| 项 | 值 |
|----|-----|
| Builder | Buildpack |
| Work directory | `backend` |
| Build command | `pip install -r requirements.txt` |
| Run command | `uvicorn app.main:app --host 0.0.0.0 --port 8000` |

将 `DATABASE_URL` 配置为 Koyeb 的环境变量（或 Secret），与本地 `.env` 含义一致。
