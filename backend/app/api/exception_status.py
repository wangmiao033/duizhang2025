"""异常处理状态 CRUD（upsert + 列表）。"""

from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.exception_status import ExceptionStatus
from app.schemas.exception_status import (
    ExceptionStatusListResponse,
    ExceptionStatusRead,
    ExceptionStatusUpsert,
)

router = APIRouter()


@router.get("", response_model=ExceptionStatusListResponse)
def list_exception_statuses(
    db: Session = Depends(get_db),
    exception_id: str | None = Query(None, description="按稳定 exception_id 精确筛选"),
    limit: int = Query(5000, ge=1, le=10000),
    offset: int = Query(0, ge=0),
) -> ExceptionStatusListResponse:
    base = select(ExceptionStatus)
    if exception_id and exception_id.strip():
        base = base.where(ExceptionStatus.exception_id == exception_id.strip())
    count_stmt = select(func.count(ExceptionStatus.id))
    if exception_id and exception_id.strip():
        count_stmt = count_stmt.where(ExceptionStatus.exception_id == exception_id.strip())
    total = int(db.execute(count_stmt).scalar_one())
    rows = (
        db.execute(base.order_by(ExceptionStatus.updated_at.desc()).limit(limit).offset(offset))
        .scalars()
        .all()
    )
    return ExceptionStatusListResponse(
        items=[ExceptionStatusRead.model_validate(r) for r in rows],
        total=total,
    )


@router.post("", response_model=ExceptionStatusRead)
def upsert_exception_status(
    payload: ExceptionStatusUpsert,
    db: Session = Depends(get_db),
) -> ExceptionStatusRead:
    st = payload.status
    eid = payload.exception_id.strip()
    row = db.execute(
        select(ExceptionStatus).where(ExceptionStatus.exception_id == eid)
    ).scalar_one_or_none()
    if row is None:
        row = ExceptionStatus(id=str(uuid4()), exception_id=eid, status=st)
        db.add(row)
    else:
        row.status = st
    db.commit()
    db.refresh(row)
    return ExceptionStatusRead.model_validate(row)
