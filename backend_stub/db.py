"""
Database URL helper for a future FastAPI backend.

Reads DATABASE_URL from the environment only. No connections, tables, or business logic.
"""

from __future__ import annotations

import os


def get_database_url() -> str:
    """
    Return the PostgreSQL connection URI from DATABASE_URL.

    Raises:
        RuntimeError: If DATABASE_URL is missing or empty after stripping whitespace.
    """
    raw = os.environ.get("DATABASE_URL")
    if raw is None or not str(raw).strip():
        raise RuntimeError(
            "DATABASE_URL is not set or is empty. "
            "Configure it in your environment or .env file (see docs/neon-setup.md)."
        )
    return str(raw).strip()
