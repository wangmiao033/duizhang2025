"""合同管理 CRUD API。"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.contract import ContractRecord
from app.schemas.contract import (
    ContractRecordCreate,
    ContractRecordListResponse,
    ContractRecordRead,
    ContractRecordUpdate,
)

router = APIRouter()


def _apply_filters(stmt, *, search: str | None):
    if search and search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                ContractRecord.channel.ilike(term),
                ContractRecord.platform.ilike(term),
                ContractRecord.game.ilike(term),
                ContractRecord.remark.ilike(term),
                ContractRecord.signing_date.ilike(term),
            )
        )
    return stmt


@router.get("", response_model=ContractRecordListResponse)
def list_contract_records(
    db: Session = Depends(get_db),
    search: str | None = Query(None),
    limit: int = Query(500, ge=1, le=1000),
    offset: int = Query(0, ge=0),
) -> ContractRecordListResponse:
    base = select(ContractRecord)
    base = _apply_filters(base, search=search)
    count_stmt = select(func.count(ContractRecord.id))
    count_stmt = _apply_filters(count_stmt, search=search)
    total = int(db.execute(count_stmt).scalar_one())
    rows = (
        db.execute(base.order_by(ContractRecord.created_at.desc()).limit(limit).offset(offset))
        .scalars()
        .all()
    )
    return ContractRecordListResponse(
        items=[ContractRecordRead.model_validate(r) for r in rows],
        total=total,
    )


@router.get("/{record_id}", response_model=ContractRecordRead)
def get_contract_record(record_id: str, db: Session = Depends(get_db)) -> ContractRecordRead:
    row = db.get(ContractRecord, record_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "id": record_id},
        )
    return ContractRecordRead.model_validate(row)


@router.post("", response_model=ContractRecordRead, status_code=status.HTTP_201_CREATED)
def create_contract_record(
    payload: ContractRecordCreate, db: Session = Depends(get_db)
) -> ContractRecordRead:
    data = payload.model_dump()
    row = ContractRecord(id=str(uuid4()), **data)
    db.add(row)
    db.commit()
    db.refresh(row)
    return ContractRecordRead.model_validate(row)


@router.put("/{record_id}", response_model=ContractRecordRead)
def update_contract_record(
    record_id: str, payload: ContractRecordUpdate, db: Session = Depends(get_db)
) -> ContractRecordRead:
    row = db.get(ContractRecord, record_id)
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
    return ContractRecordRead.model_validate(row)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contract_record(record_id: str, db: Session = Depends(get_db)) -> None:
    row = db.get(ContractRecord, record_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "id": record_id},
        )
    db.delete(row)
    db.commit()
