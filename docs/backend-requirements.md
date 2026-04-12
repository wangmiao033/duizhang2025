# 后续 FastAPI 后端 — 最小依赖建议

本仓库当前为 **前端（Vite + React）** 项目，未内置 Python 依赖文件。若后续在同一仓库或独立仓库中搭建 **FastAPI** 后端，可参考以下最小依赖组合（版本号由你在 `requirements.txt` 或 `pyproject.toml` 中按需固定）。

## 建议包

| 包 | 用途 |
|----|------|
| `fastapi` | Web 框架 |
| `uvicorn[standard]` | ASGI 服务器 |
| `psycopg[binary]` | PostgreSQL 驱动（Neon 兼容） |
| `sqlalchemy` | ORM / 连接管理 |
| `alembic` | 数据库迁移 |
| `pydantic` | 数据校验（FastAPI 已依赖，显式列出便于锁定版本） |

## 安装示例

```bash
pip install fastapi "uvicorn[standard]" "psycopg[binary]" sqlalchemy alembic pydantic
```

连接测试脚本 `scripts/test_neon_connection.py` 仅需：

```bash
pip install "psycopg[binary]"
```

本文档仅为说明；**本轮不修改前端 npm 依赖链，也不强制新增根目录 `requirements.txt`**，避免与现有构建流程混淆。
