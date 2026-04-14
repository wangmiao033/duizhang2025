"""FastAPI entrypoint."""

from __future__ import annotations

import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.api.channel import router as channel_router
from app.api.health import router as health_router
from app.api.invoice import router as invoice_router
from app.api.exception_status import router as exception_status_router
from app.api.invoice_payment_link import router as invoice_payment_link_router
from app.api.payment import router as payment_router
from app.api.bank_transaction import router as bank_transaction_router
from app.api.reconciliation import router as reconciliation_router

logger = logging.getLogger(__name__)

DEFAULT_CORS_ORIGINS = [
    "https://caiwu2026.hnchpower.cn",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]


def get_cors_origins() -> list[str]:
    """支持环境变量 CORS_EXTRA_ORIGINS（逗号分隔）追加允许的 Origin。"""
    out = list(DEFAULT_CORS_ORIGINS)
    extra = os.environ.get("CORS_EXTRA_ORIGINS", "").strip()
    if extra:
        for o in extra.split(","):
            o = o.strip()
            if o and o not in out:
                out.append(o)
    return out


def _cors_headers_for_request(request: Request, allowed: list[str]) -> dict[str, str]:
    origin = request.headers.get("origin")
    if origin and origin in allowed:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return {}


_cors_allowed = get_cors_origins()

app = FastAPI(title="caiwuapi", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_allowed,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(reconciliation_router, prefix="/api/reconciliation", tags=["reconciliation"])
app.include_router(channel_router, prefix="/api/channel-records", tags=["channel-records"])
app.include_router(invoice_router, prefix="/api/invoices", tags=["invoices"])
app.include_router(payment_router, prefix="/api/payments", tags=["payments"])
app.include_router(
    invoice_payment_link_router,
    prefix="/api/invoice-payment-links",
    tags=["invoice-payment-links"],
)
app.include_router(
    exception_status_router,
    prefix="/api/exception-statuses",
    tags=["exception-statuses"],
)
app.include_router(
    bank_transaction_router,
    prefix="/api/bank-transactions",
    tags=["bank-transactions"],
)


@app.exception_handler(SQLAlchemyError)
async def handle_sqlalchemy_error(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """
    数据库错误时仍返回带 CORS 头的 JSON，避免浏览器误报为纯 CORS 问题。
    详细栈记录在服务端日志（Koyeb Logs）。
    """
    logger.exception("SQLAlchemy error: %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "error": "database_error",
            "message": (
                "数据库查询失败。请核对 Neon：表是否存在、列是否与 ORM 一致；"
                "执行 backend/sql/002、003、004、006、007、008、009、010、011 建表，必要时执行 neon_repair_missing_columns.sql；"
                "并用 neon_verify_columns.sql 检查列清单。"
            ),
        },
        headers=_cors_headers_for_request(request, _cors_allowed),
    )


@app.get("/")
def root() -> dict:
    return {"ok": True, "service": "caiwuapi"}
