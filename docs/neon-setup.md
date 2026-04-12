# Neon PostgreSQL 配置说明

本项目后续将使用 [Neon](https://neon.tech) 托管的 **PostgreSQL** 作为服务端数据库。当前仓库仍以本地前端与 `localStorage` 为主数据源；**本轮仅完成连接与环境变量层面的准备**，未接入任何业务表或 CRUD。

## 连接串格式

Neon 在控制台提供的连接字符串通常为 PostgreSQL URI 形式，例如（**占位符，请勿提交真实密码**）：

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
```

- **协议**：`postgresql://`（与 `postgres://` 等价，常见工具均支持）
- **认证**：`USER:PASSWORD@HOST`
- **库名**：路径中的 `DATABASE`（Neon 常为 `neondb` 或你自定义的名称）
- **SSL**：Neon 要求加密连接，URI 中通常包含 `sslmode=require`（或等价参数）

后续 **FastAPI** 后端将从环境变量 **`DATABASE_URL`** 读取该连接串并建立连接。

## Pooled connection 与 Direct connection

| 类型 | 说明 | 典型用途 |
|------|------|----------|
| **Pooled（连接池）** | 经 Neon 连接池端点，适合多数应用并发 | **应用运行时连接（推荐默认）** |
| **Direct（直连）** | 直连计算节点，绕过池化 | 数据库迁移（如 Alembic）、部分管理工具、需长事务/特殊会话参数的场景 |

**建议**：应用默认连接串优先使用 **pooled**；在 `.env` 中可将 **`DATABASE_URL` 设为 pooled 地址**。将 direct 单独记在 `DATABASE_URL_DIRECT`，供迁移或特殊场景使用。

仓库根目录 `.env.example` 中提供了：

- `DATABASE_URL` — 应用主连接（建议填 **pooled**）
- `DATABASE_URL_POOLED` / `DATABASE_URL_DIRECT` — 便于区分与备份，可按需与 `DATABASE_URL` 对齐或分开展示

## 本地环境变量配置

1. 在仓库根目录复制模板：  
   `cp .env.example .env`（若你已有 `.env`，只需追加数据库相关变量）
2. 编辑 `.env`，填入 Neon 控制台复制的连接串（**勿将含真实密码的 `.env` 提交到 Git**）
3. 确保 **`DATABASE_URL`** 已设置；若只维护一条，请使用 **pooled** 连接串

命令行临时导出（示例，仍为占位符）：

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
```

## 验证连接（独立脚本）

在 Neon 控制台创建项目后：

1. 打开目标数据库，点击 **Connect**
2. 复制 **pooled connection string**（推荐）
3. 本地 `.env` 中设置 `DATABASE_URL`（或同步写入 `DATABASE_URL_POOLED`）
4. 安装 Python 依赖（连接测试需要，见 `docs/backend-requirements.md`）：

   ```bash
   pip install "psycopg[binary]"
   ```

5. 运行连接测试：

   ```bash
   python scripts/test_neon_connection.py
   ```

6. 若终端输出 **`Neon connection ok`**，说明当前 **`DATABASE_URL`** 配置可用。

脚本仅执行 `SELECT 1;`，不读写业务数据、不依赖本仓库前端代码。

## 与后续 FastAPI 的关系

- 后端启动时从 **`DATABASE_URL`** 读取连接串（与本文档及 `backend_stub/db.py` 草案一致）
- 业务表、迁移、API 将在后续迭代中单独接入；**本轮不包含业务数据库逻辑**

## 环境变量一览（数据库相关）

| 变量名 | 说明 |
|--------|------|
| `DATABASE_URL` | 应用主连接串；**建议为 pooled**；FastAPI 将从此读取 |
| `DATABASE_URL_POOLED` | 可选；显式保存 pooled 串，便于与 direct 区分 |
| `DATABASE_URL_DIRECT` | 可选；迁移工具或特殊场景使用 |

---

**本轮范围说明**：仅完成 Neon 连接配置、环境变量模板、连接测试脚本与后端连接草案文件；**未接入真实业务数据库、未替换 localStorage、未修改任何业务逻辑与 UI**。
