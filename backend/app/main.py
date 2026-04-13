"""FastAPI entrypoint."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.channel import router as channel_router
from app.api.health import router as health_router
from app.api.invoice import router as invoice_router
from app.api.payment import router as payment_router
from app.api.reconciliation import router as reconciliation_router

app = FastAPI(title="caiwuapi", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://caiwu2026.hnchpower.cn",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(reconciliation_router, prefix="/api/reconciliation", tags=["reconciliation"])
app.include_router(channel_router, prefix="/api/channel-records", tags=["channel-records"])
app.include_router(invoice_router, prefix="/api/invoices", tags=["invoices"])
app.include_router(payment_router, prefix="/api/payments", tags=["payments"])


@app.get("/")
def root() -> dict:
    return {"ok": True, "service": "caiwuapi"}
