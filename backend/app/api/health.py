"""Health endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from app.core.database import test_db_connection

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    return {"ok": True}


@router.get("/health/db")
def health_db() -> dict:
    ok, detail = test_db_connection()
    if ok:
        return {"ok": True, "database": "connected"}
    return {"ok": False, "database": "error", "detail": detail}
