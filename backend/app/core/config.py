"""Load environment from backend/.env and expose DATABASE_URL."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# backend/ directory (parent of app/)
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(_BACKEND_ROOT / ".env")


def normalize_database_url(url: str) -> str:
    """
    将常规 PostgreSQL URI 转为 SQLAlchemy 的 psycopg (v3) 方言 URL。

    SQLAlchemy 对 ``postgresql://`` 默认选用 psycopg2 驱动；本项目依赖 ``psycopg[binary]``（v3），
    必须使用 ``postgresql+psycopg://``，否则会尝试导入不存在的 ``psycopg2``。
    """
    u = url.strip()
    if u.startswith("postgresql+psycopg://"):
        return u
    if u.startswith("postgresql://"):
        return "postgresql+psycopg://" + u.removeprefix("postgresql://")
    # 部分托管方可能给出 postgres://，与 postgresql:// 等价
    if u.startswith("postgres://"):
        return "postgresql+psycopg://" + u.removeprefix("postgres://")
    return u


def get_database_url() -> str:
    """Return PostgreSQL URI from DATABASE_URL. Raises if missing or empty."""
    raw = os.environ.get("DATABASE_URL")
    if raw is None or not str(raw).strip():
        raise RuntimeError(
            "DATABASE_URL is not set or is empty. "
            "Copy .env.example to .env in the backend directory and set DATABASE_URL."
        )
    return normalize_database_url(str(raw))
