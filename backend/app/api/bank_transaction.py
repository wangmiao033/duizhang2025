"""银行流水统一台账 CRUD。"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import func, or_, select, cast, Numeric
from sqlalchemy.orm import Session

from app.core.bank_transaction_uploads import ensure_bank_transaction_upload_root
from app.core.deps import get_db
from app.models.bank_transaction import BankTransaction
from app.schemas.bank_transaction import (
    BankTransactionAttachmentUploadResponse,
    BankTransactionCreate,
    BankTransactionListResponse,
    BankTransactionRead,
    BankTransactionUpdate,
)

router = APIRouter()

_ALLOWED_TYPES = frozenset({"statement_import", "payment_register", "collection_register"})

_MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024
_UPLOAD_CONTENT_TYPES: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
}


def _safe_upload_original_name(name: str) -> str:
    base = Path(name or "file").name
    base = re.sub(r"[^\w.\-()\u4e00-\u9fff]+", "_", base)
    return base[:180] if base else "file"


def _resolve_bank_tx_upload_file(file_id: str) -> Path:
    try:
        UUID(file_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "invalid_file_id"},
        ) from e
    root = ensure_bank_transaction_upload_root().resolve()
    matches = list(root.glob(f"{file_id}.*"))
    if len(matches) != 1:
        raise HTTPException(status_code=404, detail={"error": "not_found", "id": file_id})
    path = matches[0].resolve()
    try:
        path.relative_to(root)
    except ValueError:
        raise HTTPException(status_code=400, detail={"error": "invalid_path"}) from None
    return path


def _row_to_read(row: BankTransaction) -> BankTransactionRead:
    return BankTransactionRead.model_validate(row)


@router.get("", response_model=BankTransactionListResponse)
def list_bank_transactions(
    db: Session = Depends(get_db),
    q: str | None = Query(None, description="关键词：户名、账号、流水号、备注等"),
    transaction_type: str | None = Query(
        None,
        alias="type",
        description="statement_import / payment_register / collection_register",
    ),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    amount_min: Decimal | None = Query(None),
    amount_max: Decimal | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> BankTransactionListResponse:
    stmt = select(BankTransaction)
    if transaction_type and transaction_type.strip():
        t = transaction_type.strip()
        if t not in _ALLOWED_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "invalid_type", "allowed": list(_ALLOWED_TYPES)},
            )
        stmt = stmt.where(BankTransaction.type == t)
    if date_from and date_from.strip():
        stmt = stmt.where(
            BankTransaction.trade_date.isnot(None),
            BankTransaction.trade_date >= date_from.strip(),
        )
    if date_to and date_to.strip():
        stmt = stmt.where(
            BankTransaction.trade_date.isnot(None),
            BankTransaction.trade_date <= date_to.strip(),
        )
    if amount_min is not None:
        stmt = stmt.where(
            BankTransaction.amount.isnot(None),
            cast(BankTransaction.amount, Numeric) >= amount_min,
        )
    if amount_max is not None:
        stmt = stmt.where(
            BankTransaction.amount.isnot(None),
            cast(BankTransaction.amount, Numeric) <= amount_max,
        )
    if q and q.strip():
        term = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                BankTransaction.payer_name.ilike(term),
                BankTransaction.payee_name.ilike(term),
                BankTransaction.bank_account.ilike(term),
                BankTransaction.payer_account.ilike(term),
                BankTransaction.payee_account.ilike(term),
                BankTransaction.transaction_no.ilike(term),
                BankTransaction.instruction_no.ilike(term),
                BankTransaction.remark.ilike(term),
                BankTransaction.summary.ilike(term),
            )
        )

    total = int(db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one())

    rows = (
        db.execute(stmt.order_by(BankTransaction.created_at.desc()).limit(limit).offset(offset))
        .scalars()
        .all()
    )
    return BankTransactionListResponse(items=[_row_to_read(r) for r in rows], total=total)


@router.post(
    "/upload-attachment",
    response_model=BankTransactionAttachmentUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_bank_transaction_attachment(
    file: UploadFile = File(...),
) -> BankTransactionAttachmentUploadResponse:
    """付款确认单等：上传回单至本地目录，返回可写入 attachment_url 的下载路径。"""
    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if content_type not in _UPLOAD_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "unsupported_file_type",
                "message": "仅支持图片（JPEG/PNG/GIF/WebP）与 PDF",
            },
        )
    ext = _UPLOAD_CONTENT_TYPES[content_type]
    body = await file.read()
    if len(body) > _MAX_ATTACHMENT_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={"error": "file_too_large", "max_bytes": _MAX_ATTACHMENT_BYTES},
        )

    file_id = str(uuid4())
    root = ensure_bank_transaction_upload_root()
    dest_path = root / f"{file_id}{ext}"
    dest_path.write_bytes(body)
    orig_name = _safe_upload_original_name(file.filename or f"attachment{ext}")
    download_url = f"/api/bank-transactions/attachments/{file_id}/file"
    return BankTransactionAttachmentUploadResponse(file_url=download_url, file_name=orig_name)


@router.get("/attachments/{file_id}/file")
def download_bank_transaction_attachment(file_id: str) -> FileResponse:
    path = _resolve_bank_tx_upload_file(file_id)
    return FileResponse(
        path,
        filename=path.name,
        content_disposition_type="inline",
    )


@router.get("/{transaction_id}", response_model=BankTransactionRead)
def get_bank_transaction(transaction_id: str, db: Session = Depends(get_db)) -> BankTransactionRead:
    row = db.get(BankTransaction, transaction_id)
    if row is None:
        raise HTTPException(status_code=404, detail={"error": "not_found", "id": transaction_id})
    return _row_to_read(row)


@router.post("", response_model=BankTransactionRead, status_code=status.HTTP_201_CREATED)
def create_bank_transaction(
    payload: BankTransactionCreate, db: Session = Depends(get_db)
) -> BankTransactionRead:
    if payload.type not in _ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "invalid_type", "allowed": list(_ALLOWED_TYPES)},
        )
    data = payload.model_dump(exclude_unset=True)
    row = BankTransaction(id=str(uuid4()), **data)
    db.add(row)
    db.commit()
    db.refresh(row)
    return _row_to_read(row)


@router.put("/{transaction_id}", response_model=BankTransactionRead)
def update_bank_transaction(
    transaction_id: str, payload: BankTransactionUpdate, db: Session = Depends(get_db)
) -> BankTransactionRead:
    row = db.get(BankTransaction, transaction_id)
    if row is None:
        raise HTTPException(status_code=404, detail={"error": "not_found", "id": transaction_id})
    data = payload.model_dump(exclude_unset=True)
    if "type" in data and data["type"] not in _ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "invalid_type", "allowed": list(_ALLOWED_TYPES)},
        )
    for k, v in data.items():
        setattr(row, k, v)
    row.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(row)
    return _row_to_read(row)


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bank_transaction(transaction_id: str, db: Session = Depends(get_db)) -> None:
    row = db.get(BankTransaction, transaction_id)
    if row is None:
        raise HTTPException(status_code=404, detail={"error": "not_found", "id": transaction_id})
    db.delete(row)
    db.commit()
