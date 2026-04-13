"""研发对账 —付款流水单（打款登记）API。"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.bank_payment_uploads import ensure_upload_root
from app.core.deps import get_db
from app.models.bank_payment import BankPaymentRecord
from app.models.bank_payment_attachment import BankPaymentAttachment
from app.models.reconciliation import ReconciliationRecord
from app.schemas.bank_payment import (
    BankPaymentAttachmentListResponse,
    BankPaymentAttachmentRead,
    BankPaymentRead,
    BankPaymentUpsert,
)

router = APIRouter()

_MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024
_ALLOWED_CONTENT_TYPES: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
}


def _require_reconciliation(db: Session, record_id: str) -> ReconciliationRecord:
    parent = db.get(ReconciliationRecord, record_id)
    if parent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "id": record_id},
        )
    return parent


def _get_bank_payment(db: Session, record_id: str) -> BankPaymentRecord | None:
    return db.execute(
        select(BankPaymentRecord).where(BankPaymentRecord.reconciliation_id == record_id)
    ).scalar_one_or_none()


def _get_or_create_empty_bank_payment(db: Session, record_id: str) -> BankPaymentRecord:
    _require_reconciliation(db, record_id)
    bp = _get_bank_payment(db, record_id)
    if bp is not None:
        return bp
    bp = BankPaymentRecord(
        id=str(uuid4()),
        reconciliation_id=record_id,
        remittance_amount=0,
        transfer_status="pending_submit",
        is_scheduled=False,
        is_personal_payee=False,
    )
    db.add(bp)
    db.commit()
    db.refresh(bp)
    return bp


def _safe_original_name(name: str) -> str:
    base = Path(name or "file").name
    base = re.sub(r"[^\w.\-()\u4e00-\u9fff]+", "_", base)
    return base[:180] if base else "file"


def _attachment_disk_path(file_url: str) -> Path:
    """file_url 存相对路径：{bank_payment_id}/{attachment_id}{ext}"""
    rel = (file_url or "").strip().lstrip("/").replace("..", "")
    if not rel or "/" not in rel:
        raise HTTPException(status_code=400, detail={"error": "invalid_storage_key"})
    root = ensure_upload_root().resolve()
    path = (root / rel).resolve()
    try:
        path.relative_to(root)
    except ValueError:
        raise HTTPException(status_code=400, detail={"error": "invalid_path"})
    return path


def _attachment_to_read(att: BankPaymentAttachment, record_id: str) -> BankPaymentAttachmentRead:
    download_path = (
        f"/api/reconciliation/{record_id}/bank-payment/attachments/{att.id}/file"
    )
    return BankPaymentAttachmentRead(
        id=att.id,
        bank_payment_id=att.bank_payment_id,
        file_name=att.file_name,
        file_url=download_path,
        file_type=att.file_type,
        created_at=att.created_at,
    )


@router.get("/{record_id}/bank-payment", response_model=BankPaymentRead | None)
def get_bank_payment(record_id: str, db: Session = Depends(get_db)) -> BankPaymentRead | None:
    _require_reconciliation(db, record_id)
    bp = _get_bank_payment(db, record_id)
    if bp is None:
        return None
    return BankPaymentRead.model_validate(bp)


@router.put("/{record_id}/bank-payment", response_model=BankPaymentRead)
def upsert_bank_payment(
    record_id: str, payload: BankPaymentUpsert, db: Session = Depends(get_db)
) -> BankPaymentRead:
    _require_reconciliation(db, record_id)
    bp = _get_bank_payment(db, record_id)
    data = payload.model_dump()
    if bp is None:
        bp = BankPaymentRecord(
            id=str(uuid4()),
            reconciliation_id=record_id,
            **data,
        )
        db.add(bp)
    else:
        for key, value in data.items():
            setattr(bp, key, value)
        bp.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(bp)
    return BankPaymentRead.model_validate(bp)


@router.get(
    "/{record_id}/bank-payment/attachments",
    response_model=BankPaymentAttachmentListResponse,
)
def list_bank_payment_attachments(
    record_id: str, db: Session = Depends(get_db)
) -> BankPaymentAttachmentListResponse:
    _require_reconciliation(db, record_id)
    bp = _get_bank_payment(db, record_id)
    if bp is None:
        return BankPaymentAttachmentListResponse(items=[])
    rows = db.execute(
        select(BankPaymentAttachment)
        .where(BankPaymentAttachment.bank_payment_id == bp.id)
        .order_by(BankPaymentAttachment.created_at.desc())
    ).scalars().all()
    return BankPaymentAttachmentListResponse(
        items=[_attachment_to_read(r, record_id) for r in rows]
    )


@router.post(
    "/{record_id}/bank-payment/attachments",
    response_model=BankPaymentAttachmentRead,
    status_code=status.HTTP_201_CREATED,
)
async def upload_bank_payment_attachment(
    record_id: str,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
) -> BankPaymentAttachmentRead:
    _require_reconciliation(db, record_id)
    bp = _get_or_create_empty_bank_payment(db, record_id)

    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if content_type not in _ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "unsupported_file_type",
                "message": "仅支持图片（JPEG/PNG/GIF/WebP）与 PDF",
            },
        )
    ext = _ALLOWED_CONTENT_TYPES[content_type]
    body = await file.read()
    if len(body) > _MAX_ATTACHMENT_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={"error": "file_too_large", "max_bytes": _MAX_ATTACHMENT_BYTES},
        )

    att_id = str(uuid4())
    rel = f"{bp.id}/{att_id}{ext}"
    root = ensure_upload_root()
    dest_dir = root / bp.id
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / f"{att_id}{ext}"
    dest_path.write_bytes(body)

    orig_name = _safe_original_name(file.filename or f"attachment{ext}")
    row = BankPaymentAttachment(
        id=att_id,
        bank_payment_id=bp.id,
        file_name=orig_name,
        file_url=rel,
        file_type=content_type,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _attachment_to_read(row, record_id)


@router.delete(
    "/{record_id}/bank-payment/attachments/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_bank_payment_attachment(
    record_id: str, attachment_id: str, db: Session = Depends(get_db)
) -> None:
    _require_reconciliation(db, record_id)
    bp = _get_bank_payment(db, record_id)
    if bp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "not_found"})
    att = db.get(BankPaymentAttachment, attachment_id)
    if att is None or att.bank_payment_id != bp.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "not_found"})
    try:
        path = _attachment_disk_path(att.file_url)
        if path.is_file():
            path.unlink()
    except HTTPException:
        pass
    db.delete(att)
    db.commit()


@router.get("/{record_id}/bank-payment/attachments/{attachment_id}/file")
def download_bank_payment_attachment(
    record_id: str, attachment_id: str, db: Session = Depends(get_db)
) -> FileResponse:
    _require_reconciliation(db, record_id)
    bp = _get_bank_payment(db, record_id)
    if bp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "not_found"})
    att = db.get(BankPaymentAttachment, attachment_id)
    if att is None or att.bank_payment_id != bp.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "not_found"})
    path = _attachment_disk_path(att.file_url)
    if not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "file_missing"})
    media = att.file_type or "application/octet-stream"
    return FileResponse(
        path,
        media_type=media,
        filename=att.file_name,
    )
