"""研发对账 —付款流水单（打款登记）API。"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.bank_payment import BankPaymentRecord
from app.models.reconciliation import ReconciliationRecord
from app.schemas.bank_payment import BankPaymentRead, BankPaymentUpsert

router = APIRouter()


@router.get("/{record_id}/bank-payment", response_model=BankPaymentRead | None)
def get_bank_payment(record_id: str, db: Session = Depends(get_db)) -> BankPaymentRead | None:
    parent = db.get(ReconciliationRecord, record_id)
    if parent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "id": record_id},
        )
    bp = db.execute(
        select(BankPaymentRecord).where(BankPaymentRecord.reconciliation_id == record_id)
    ).scalar_one_or_none()
    if bp is None:
        return None
    return BankPaymentRead.model_validate(bp)


@router.put("/{record_id}/bank-payment", response_model=BankPaymentRead)
def upsert_bank_payment(
    record_id: str, payload: BankPaymentUpsert, db: Session = Depends(get_db)
) -> BankPaymentRead:
    parent = db.get(ReconciliationRecord, record_id)
    if parent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "id": record_id},
        )
    bp = db.execute(
        select(BankPaymentRecord).where(BankPaymentRecord.reconciliation_id == record_id)
    ).scalar_one_or_none()
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
