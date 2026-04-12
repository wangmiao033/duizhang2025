"""Load environment from backend/.env and expose DATABASE_URL."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# backend/ directory (parent of app/)
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(_BACKEND_ROOT / ".env")


def get_database_url() -> str:
    """Return PostgreSQL URI from DATABASE_URL. Raises if missing or empty."""
    raw = os.environ.get("DATABASE_URL")
    if raw is None or not str(raw).strip():
        raise RuntimeError(
            "DATABASE_URL is not set or is empty. "
            "Copy .env.example to .env in the backend directory and set DATABASE_URL."
        )
    return str(raw).strip()
