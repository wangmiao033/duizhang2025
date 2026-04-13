"""发票台账 CRUD API。"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.invoice import InvoiceRecord
from app.schemas.invoice import (
    InvoiceRecordCreate,
    InvoiceRecordListResponse,
    InvoiceRecordRead,
    InvoiceRecordUpdate,
)

router = APIRouter()


def _normalize_verified_ids(raw: list | None) -> list[str]:
    if not raw:
        return []
    out: list[str] = []
    for x in raw:
        if x is None:
            continue
        out.append(str(x))
    return out


def _apply_filters(stmt, *, search: str | None, status: str | None):
    if search and search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                InvoiceRecord.title.ilike(term),
                InvoiceRecord.tax_no.ilike(term),
                InvoiceRecord.remark.ilike(term),
                InvoiceRecord.invoice_date.ilike(term),
            )
        )
    if status and status.strip():
        stmt = stmt.where(InvoiceRecord.status == status.strip())
    return stmt


@router.get("", response_model=InvoiceRecordListResponse)
def list_invoice_records(
    db: Session = Depends(get_db),
    search: str | None = Query(None),
    status: str | None = Query(None),
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> InvoiceRecordListResponse:
    base = select(InvoiceRecord)
    base = _apply_filters(base, search=search, status=status)
    count_stmt = select(func.count(InvoiceRecord.id))
    count_stmt = _apply_filters(count_stmt, search=search, status=status)
    total = int(db.execute(count_stmt).scalar_one())
    rows = (
        db.execute(base.order_by(InvoiceRecord.created_at.desc()).limit(limit).offset(offset))
        .scalars()
        .all()
    )
    return InvoiceRecordListResponse(
        items=[InvoiceRecordRead.model_validate(r) for r in rows],
        total=total,
    )


@router.get("/{record_id}", response_model=InvoiceRecordRead)
def get_invoice_record(record_id: str, db: Session = Depends(get_db)) -> InvoiceRecordRead:
    row = db.get(InvoiceRecord, record_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "id": record_id},
        )
    return InvoiceRecordRead.model_validate(row)


@router.post("", response_model=InvoiceRecordRead, status_code=status.HTTP_201_CREATED)
def create_invoice_record(
    payload: InvoiceRecordCreate, db: Session = Depends(get_db)
) -> InvoiceRecordRead:
    data = payload.model_dump()
    data["verified_record_ids"] = _normalize_verified_ids(data.get("verified_record_ids"))
    row = InvoiceRecord(id=str(uuid4()), **data)
    db.add(row)
    db.commit()
    db.refresh(row)
    return InvoiceRecordRead.model_validate(row)


@router.put("/{record_id}", response_model=InvoiceRecordRead)
def update_invoice_record(
    record_id: str, payload: InvoiceRecordUpdate, db: Session = Depends(get_db)
) -> InvoiceRecordRead:
    row = db.get(InvoiceRecord, record_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "id": record_id},
        )
    patch = payload.model_dump(exclude_unset=True)
    if "verified_record_ids" in patch and patch["verified_record_ids"] is not None:
        patch["verified_record_ids"] = _normalize_verified_ids(patch["verified_record_ids"])
    for key, value in patch.items():
        setattr(row, key, value)
    row.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(row)
    return InvoiceRecordRead.model_validate(row)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice_record(record_id: str, db: Session = Depends(get_db)) -> None:
    row = db.get(InvoiceRecord, record_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "id": record_id},
        )
    db.delete(row)
    db.commit()
