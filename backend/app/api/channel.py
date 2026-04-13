"""渠道对账 CRUD API。"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.channel import ChannelRecord
from app.schemas.channel import (
    ChannelRecordCreate,
    ChannelRecordListResponse,
    ChannelRecordRead,
    ChannelRecordUpdate,
)

router = APIRouter()


def _apply_filters(
    stmt,
    *,
    search: str | None,
    settlement_month: str | None,
    channel_name: str | None,
    game_name: str | None,
    status: str | None,
):
    if search and search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                ChannelRecord.channel_name.ilike(term),
                ChannelRecord.game_name.ilike(term),
                ChannelRecord.settlement_month.ilike(term),
                ChannelRecord.remark.ilike(term),
                ChannelRecord.start_date.ilike(term),
            )
        )
    if settlement_month and settlement_month.strip():
        stmt = stmt.where(ChannelRecord.settlement_month == settlement_month.strip())
    if channel_name and channel_name.strip():
        stmt = stmt.where(ChannelRecord.channel_name.ilike(f"%{channel_name.strip()}%"))
    if game_name and game_name.strip():
        stmt = stmt.where(ChannelRecord.game_name.ilike(f"%{game_name.strip()}%"))
    if status and status.strip():
        stmt = stmt.where(ChannelRecord.status == status.strip())
    return stmt


@router.get("", response_model=ChannelRecordListResponse)
def list_channel_records(
    db: Session = Depends(get_db),
    search: str | None = Query(None),
    settlement_month: str | None = Query(None),
    channel_name: str | None = Query(None),
    game_name: str | None = Query(None),
    status: str | None = Query(None),
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> ChannelRecordListResponse:
    base = select(ChannelRecord)
    base = _apply_filters(
        base,
        search=search,
        settlement_month=settlement_month,
        channel_name=channel_name,
        game_name=game_name,
        status=status,
    )
    count_stmt = select(func.count(ChannelRecord.id))
    count_stmt = _apply_filters(
        count_stmt,
        search=search,
        settlement_month=settlement_month,
        channel_name=channel_name,
        game_name=game_name,
        status=status,
    )
    total = int(db.execute(count_stmt).scalar_one())
    rows = (
        db.execute(base.order_by(ChannelRecord.created_at.desc()).limit(limit).offset(offset))
        .scalars()
        .all()
    )
    return ChannelRecordListResponse(
        items=[ChannelRecordRead.model_validate(r) for r in rows],
        total=total,
    )


@router.get("/{record_id}", response_model=ChannelRecordRead)
def get_channel_record(record_id: str, db: Session = Depends(get_db)) -> ChannelRecordRead:
    row = db.get(ChannelRecord, record_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "id": record_id},
        )
    return ChannelRecordRead.model_validate(row)


@router.post("", response_model=ChannelRecordRead, status_code=status.HTTP_201_CREATED)
def create_channel_record(
    payload: ChannelRecordCreate, db: Session = Depends(get_db)
) -> ChannelRecordRead:
    data = payload.model_dump()
    row = ChannelRecord(id=str(uuid4()), **data)
    db.add(row)
    db.commit()
    db.refresh(row)
    return ChannelRecordRead.model_validate(row)


@router.put("/{record_id}", response_model=ChannelRecordRead)
def update_channel_record(
    record_id: str, payload: ChannelRecordUpdate, db: Session = Depends(get_db)
) -> ChannelRecordRead:
    row = db.get(ChannelRecord, record_id)
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
    return ChannelRecordRead.model_validate(row)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_channel_record(record_id: str, db: Session = Depends(get_db)) -> None:
    row = db.get(ChannelRecord, record_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "id": record_id},
        )
    db.delete(row)
    db.commit()
