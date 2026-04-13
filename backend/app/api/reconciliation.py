"""研发对账 CRUD API。"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError, OperationalError, ProgrammingError
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.bank_payment import BankPaymentRecord
from app.models.reconciliation import ReconciliationRecord
from app.services.bank_payment_status import compute_bank_payment_list_status
from app.schemas.reconciliation import (
    ReconciliationCreate,
    ReconciliationListResponse,
    ReconciliationRead,
    ReconciliationUpdate,
)

router = APIRouter()


def _apply_filters(
    stmt,
    *,
    search: str | None,
    settlement_month: str | None,
    partner_name: str | None,
    game_name: str | None,
    status: str | None,
):
    if search and search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                ReconciliationRecord.statement_no.ilike(term),
                ReconciliationRecord.partner_name.ilike(term),
                ReconciliationRecord.game_name.ilike(term),
                ReconciliationRecord.settlement_month.ilike(term),
                ReconciliationRecord.remark.ilike(term),
            )
        )
    if settlement_month and settlement_month.strip():
        stmt = stmt.where(ReconciliationRecord.settlement_month == settlement_month.strip())
    if partner_name and partner_name.strip():
        stmt = stmt.where(ReconciliationRecord.partner_name.ilike(f"%{partner_name.strip()}%"))
    if game_name and game_name.strip():
        stmt = stmt.where(ReconciliationRecord.game_name.ilike(f"%{game_name.strip()}%"))
    if status and status.strip():
        stmt = stmt.where(ReconciliationRecord.status == status.strip())
    return stmt


@router.get("", response_model=ReconciliationListResponse)
def list_reconciliation(
    db: Session = Depends(get_db),
    search: str | None = Query(None),
    settlement_month: str | None = Query(None),
    partner_name: str | None = Query(None),
    game_name: str | None = Query(None),
    status: str | None = Query(None),
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> ReconciliationListResponse:
    base = select(ReconciliationRecord)
    base = _apply_filters(
        base,
        search=search,
        settlement_month=settlement_month,
        partner_name=partner_name,
        game_name=game_name,
        status=status,
    )
    count_stmt = select(func.count(ReconciliationRecord.id))
    count_stmt = _apply_filters(
        count_stmt,
        search=search,
        settlement_month=settlement_month,
        partner_name=partner_name,
        game_name=game_name,
        status=status,
    )
    total = int(db.execute(count_stmt).scalar_one())
    rows = db.execute(base.order_by(ReconciliationRecord.created_at.desc()).limit(limit).offset(offset)).scalars().all()
    bp_map: dict[str, BankPaymentRecord] = {}
    if rows:
        ids = [r.id for r in rows]
        try:
            bps = db.execute(
                select(BankPaymentRecord).where(BankPaymentRecord.reconciliation_id.in_(ids))
            ).scalars().all()
            bp_map = {b.reconciliation_id: b for b in bps}
        except (OperationalError, ProgrammingError):
            bp_map = {}
    items = []
    for r in rows:
        base_read = ReconciliationRead.model_validate(r)
        st = compute_bank_payment_list_status(float(r.settlement_amount or 0), bp_map.get(r.id))
        items.append(base_read.model_copy(update={"bank_payment_list_status": st}))
    return ReconciliationListResponse(items=items, total=total)


@router.get("/{record_id}", response_model=ReconciliationRead)
def get_reconciliation(record_id: str, db: Session = Depends(get_db)) -> ReconciliationRead:
    row = db.get(ReconciliationRecord, record_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "not_found", "id": record_id})
    return ReconciliationRead.model_validate(row)


@router.post("", response_model=ReconciliationRead, status_code=status.HTTP_201_CREATED)
def create_reconciliation(payload: ReconciliationCreate, db: Session = Depends(get_db)) -> ReconciliationRead:
    raw_no = (payload.statement_no or "").strip()
    statement_no = raw_no or f"RD-{uuid4().hex[:12].upper()}"
    row = ReconciliationRecord(
        id=str(uuid4()),
        statement_no=statement_no,
        settlement_month=payload.settlement_month,
        partner_name=payload.partner_name,
        game_name=payload.game_name,
        game_flow=payload.game_flow,
        test_cost=payload.test_cost,
        voucher_cost=payload.voucher_cost,
        channel_fee_rate=payload.channel_fee_rate,
        tax_rate=payload.tax_rate,
        revenue_share_rate=payload.revenue_share_rate,
        discount_value=payload.discount_value,
        refund_amount=payload.refund_amount,
        settlement_amount=payload.settlement_amount,
        status=payload.status or "pending",
        remark=payload.remark,
    )
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": "statement_no_conflict", "statement_no": statement_no},
        ) from None
    db.refresh(row)
    return ReconciliationRead.model_validate(row)


@router.put("/{record_id}", response_model=ReconciliationRead)
def update_reconciliation(
    record_id: str, payload: ReconciliationUpdate, db: Session = Depends(get_db)
) -> ReconciliationRead:
    row = db.get(ReconciliationRecord, record_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "not_found", "id": record_id})
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(row, key, value)
    row.updated_at = datetime.now(timezone.utc)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": "statement_no_conflict"},
        ) from None
    db.refresh(row)
    return ReconciliationRead.model_validate(row)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reconciliation(record_id: str, db: Session = Depends(get_db)) -> None:
    row = db.get(ReconciliationRecord, record_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "not_found", "id": record_id})
    db.delete(row)
    db.commit()
