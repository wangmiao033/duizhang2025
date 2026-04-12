"""SQLAlchemy engine and connectivity check."""

from __future__ import annotations

from typing import Any

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from app.core.config import get_database_url

_engine: Engine | None = None


def get_engine() -> Engine:
    """Singleton SQLAlchemy engine using DATABASE_URL."""
    global _engine
    if _engine is None:
        _engine = create_engine(get_database_url(), pool_pre_ping=True)
    return _engine


def test_db_connection() -> tuple[bool, Any]:
    """
    Run SELECT 1 against the database.

    Returns:
        (True, None) on success, or (False, error_detail) on failure.
    """
    try:
        with get_engine().connect() as conn:
            conn.execute(text("SELECT 1"))
        return True, None
    except Exception as e:
        return False, str(e)
