"""FastAPI entrypoint."""

from __future__ import annotations

import logging
import os
from pathlib import Path

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import SQLAlchemyError

from app.api.channel import router as channel_router
from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.invoice import router as invoice_router
from app.api.exception_status import router as exception_status_router
from app.api.invoice_payment_link import router as invoice_payment_link_router
from app.api.payment import router as payment_router
from app.api.bank_transaction import router as bank_transaction_router
from app.api.reconciliation import router as reconciliation_router
from app.api.contract import router as contract_router
from app.api.quicksdk import router as quicksdk_router
from app.core.security import require_current_user

logger = logging.getLogger(__name__)

DEFAULT_CORS_ORIGINS = [
    "https://cf.hnchpower.cn",
    "https://caiwu2026.hnchpower.cn",
    "https://duizhang2025.vercel.app",
    "https://www.duizhang2025.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]


def get_cors_origins() -> list[str]:
    """支持环境变量 CORS_EXTRA_ORIGINS（逗号分隔）追加允许的 Origin。"""
    out = list(DEFAULT_CORS_ORIGINS)
    primary = os.environ.get("CORS_ORIGIN", "").strip()
    if primary and primary not in out:
        out.append(primary)
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
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(
    reconciliation_router,
    prefix="/api/reconciliation",
    tags=["reconciliation"],
    dependencies=[Depends(require_current_user)],
)
app.include_router(
    channel_router,
    prefix="/api/channel-records",
    tags=["channel-records"],
    dependencies=[Depends(require_current_user)],
)
app.include_router(
    invoice_router,
    prefix="/api/invoices",
    tags=["invoices"],
    dependencies=[Depends(require_current_user)],
)
app.include_router(
    payment_router,
    prefix="/api/payments",
    tags=["payments"],
    dependencies=[Depends(require_current_user)],
)
app.include_router(
    invoice_payment_link_router,
    prefix="/api/invoice-payment-links",
    tags=["invoice-payment-links"],
    dependencies=[Depends(require_current_user)],
)
app.include_router(
    exception_status_router,
    prefix="/api/exception-statuses",
    tags=["exception-statuses"],
    dependencies=[Depends(require_current_user)],
)
app.include_router(
    bank_transaction_router,
    prefix="/api/bank-transactions",
    tags=["bank-transactions"],
    dependencies=[Depends(require_current_user)],
)
app.include_router(
    contract_router,
    prefix="/api/contracts",
    tags=["contracts"],
    dependencies=[Depends(require_current_user)],
)
app.include_router(
    quicksdk_router,
    prefix="/api/quicksdk",
    tags=["quicksdk"],
    dependencies=[Depends(require_current_user)],
)

Path("uploads").mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.exception_handler(SQLAlchemyError)
async def handle_sqlalchemy_error(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """
    数据库错误时仍返回带 CORS 头的 JSON，避免浏览器误报为纯 CORS 问题。
    详细栈记录在服务端日志（systemd journal）。
    """
    logger.exception("SQLAlchemy error: %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "error": "database_error",
            "message": (
                "数据库查询失败。请检查 PostgreSQL 表结构是否与当前代码一致，"
                "必要时重新执行 backend/sql 下的迁移脚本。"
            ),
        },
        headers=_cors_headers_for_request(request, _cors_allowed),
    )


@app.get("/")
def root() -> dict:
    return {"ok": True, "service": "caiwuapi"}
