"""回款登记 CRUD API。"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.payment import PaymentRecord
from app.schemas.payment import (
    PaymentRecordCreate,
    PaymentRecordListResponse,
    PaymentRecordRead,
    PaymentRecordUpdate,
)

router = APIRouter()


def _apply_filters(stmt, *, search: str | None, status: str | None):
    if search and search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                PaymentRecord.delivery_no.ilike(term),
                PaymentRecord.company.ilike(term),
                PaymentRecord.recipient.ilike(term),
                PaymentRecord.customer.ilike(term),
                PaymentRecord.remark.ilike(term),
            )
        )
    if status and status.strip():
        stmt = stmt.where(PaymentRecord.status == status.strip())
    return stmt


@router.get("", response_model=PaymentRecordListResponse)
def list_payment_records(
    db: Session = Depends(get_db),
    search: str | None = Query(None),
    status: str | None = Query(None),
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> PaymentRecordListResponse:
    base = select(PaymentRecord)
    base = _apply_filters(base, search=search, status=status)
    count_stmt = select(func.count(PaymentRecord.id))
    count_stmt = _apply_filters(count_stmt, search=search, status=status)
    total = int(db.execute(count_stmt).scalar_one())
    rows = (
        db.execute(base.order_by(PaymentRecord.created_at.desc()).limit(limit).offset(offset))
        .scalars()
        .all()
    )
    return PaymentRecordListResponse(
        items=[PaymentRecordRead.model_validate(r) for r in rows],
        total=total,
    )


@router.get("/{record_id}", response_model=PaymentRecordRead)
def get_payment_record(record_id: str, db: Session = Depends(get_db)) -> PaymentRecordRead:
    row = db.get(PaymentRecord, record_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "id": record_id},
        )
    return PaymentRecordRead.model_validate(row)


@router.post("", response_model=PaymentRecordRead, status_code=status.HTTP_201_CREATED)
def create_payment_record(
    payload: PaymentRecordCreate, db: Session = Depends(get_db)
) -> PaymentRecordRead:
    data = payload.model_dump()
    row = PaymentRecord(id=str(uuid4()), **data)
    db.add(row)
    db.commit()
    db.refresh(row)
    return PaymentRecordRead.model_validate(row)


@router.put("/{record_id}", response_model=PaymentRecordRead)
def update_payment_record(
    record_id: str, payload: PaymentRecordUpdate, db: Session = Depends(get_db)
) -> PaymentRecordRead:
    row = db.get(PaymentRecord, record_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "id": record_id},
        )
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    row.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(row)
    return PaymentRecordRead.model_validate(row)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment_record(record_id: str, db: Session = Depends(get_db)) -> None:
    row = db.get(PaymentRecord, record_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "id": record_id},
        )
    db.delete(row)
    db.commit()
