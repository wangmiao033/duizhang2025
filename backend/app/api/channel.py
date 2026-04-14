"""渠道对账 CRUD API：主表 + 明细行。"""

from __future__ import annotations

import shutil
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import delete, exists, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.deps import get_db
from app.models.channel import ChannelReceipt, ChannelRecord, ChannelRecordLineItem
from app.schemas.channel import (
    ChannelLineItemCreate,
    ChannelLineItemRead,
    ChannelReceiptCreate,
    ChannelRecordCreate,
    ChannelRecordListResponse,
    ChannelRecordRead,
    ChannelRecordUpdate,
)

router = APIRouter()

UPLOAD_DIR = Path("uploads/channel_receipts")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _recompute_receipt_rollup(db: Session, row: ChannelRecord) -> None:
    """按 channel_receipts 汇总已收金额，并更新 receipt_status（相对结算应收 settlement_amount）。"""
    total_raw = db.execute(
        select(func.coalesce(func.sum(ChannelReceipt.amount), 0)).where(
            ChannelReceipt.channel_record_id == row.id
        )
    ).scalar_one()
    row.received_amount = float(total_raw or 0)
    receivable = float(row.settlement_amount or 0)
    recv = row.received_amount
    # 已收 >= 应收 → 已收（含应收为 0 且已收为 0）；已收 <= 0 → 未收；其余部分收
    if recv + 1e-9 >= receivable:
        row.receipt_status = "paid"
    elif recv <= 0:
        row.receipt_status = "unpaid"
    else:
        row.receipt_status = "partial"


def _sync_denormalized_totals(row: ChannelRecord, db: Session) -> None:
    """将明细汇总写回主表，便于筛选与旧逻辑读取。"""
    items = (
        db.execute(
            select(ChannelRecordLineItem)
            .where(ChannelRecordLineItem.channel_record_id == row.id)
            .order_by(ChannelRecordLineItem.sort_order)
        )
        .scalars()
        .all()
    )
    if not items:
        return
    row.billing_flow = float(sum(float(i.billing_flow or 0) for i in items))
    row.voucher_cost = float(sum(float(i.voucher_cost or 0) for i in items))
    row.no_worry_cost = float(sum(float(i.no_worry_cost or 0) for i in items))
    row.refund_cost = float(sum(float(i.refund_cost or 0) for i in items))
    row.test_cost = float(sum(float(i.test_cost or 0) for i in items))
    row.welfare_cost = float(sum(float(i.welfare_cost or 0) for i in items))
    row.billing_amount = float(sum(float(i.billing_amount or 0) for i in items))
    row.share_amount = float(sum(float(i.share_amount or 0) for i in items))
    row.gateway_cost = float(sum(float(i.gateway_cost or 0) for i in items))
    row.settlement_amount = float(sum(float(i.settlement_amount or 0) for i in items))
    row.tax_rate = float(items[0].tax_rate or 0)
    row.share_rate = float(items[0].share_rate or 0)
    names = [i.game_name for i in items if i.game_name]
    row.game_name = "、".join(names)[:2000] if names else None


def _legacy_items_from_row(row: ChannelRecord) -> list[ChannelLineItemRead]:
    if not (row.game_name or row.billing_flow):
        return []
    return [
        ChannelLineItemRead(
            id=f"legacy-{row.id}",
            channel_record_id=row.id,
            sort_order=0,
            game_name=row.game_name,
            billing_flow=float(row.billing_flow or 0),
            voucher_cost=float(row.voucher_cost or 0),
            no_worry_cost=float(row.no_worry_cost or 0),
            refund_cost=float(row.refund_cost or 0),
            test_cost=float(row.test_cost or 0),
            welfare_cost=float(row.welfare_cost or 0),
            share_rate=float(row.share_rate or 0),
            billing_amount=float(row.billing_amount or 0),
            share_amount=float(row.share_amount or 0),
            tax_rate=float(row.tax_rate or 0),
            gateway_cost=float(row.gateway_cost or 0),
            settlement_amount=float(row.settlement_amount or 0),
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
    ]


def _to_read(row: ChannelRecord) -> ChannelRecordRead:
    li = list(row.line_items or [])
    if li:
        item_reads = [
            ChannelLineItemRead.model_validate(x) for x in sorted(li, key=lambda x: x.sort_order)
        ]
    else:
        item_reads = _legacy_items_from_row(row)
    base = ChannelRecordRead.model_validate(row)
    return base.model_copy(update={"items": item_reads})


def _replace_line_items(db: Session, parent_id: str, items: list[ChannelLineItemCreate]) -> None:
    db.execute(delete(ChannelRecordLineItem).where(ChannelRecordLineItem.channel_record_id == parent_id))
    for idx, it in enumerate(items):
        db.add(
            ChannelRecordLineItem(
                id=str(uuid4()),
                channel_record_id=parent_id,
                sort_order=idx,
                **it.model_dump(),
            )
        )


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
        item_game = exists(
            select(ChannelRecordLineItem.id).where(
                ChannelRecordLineItem.channel_record_id == ChannelRecord.id,
                ChannelRecordLineItem.game_name.ilike(term),
            )
        )
        stmt = stmt.where(
            or_(
                ChannelRecord.channel_name.ilike(term),
                ChannelRecord.game_name.ilike(term),
                ChannelRecord.settlement_month.ilike(term),
                ChannelRecord.remark.ilike(term),
                ChannelRecord.start_date.ilike(term),
                item_game,
            )
        )
    if settlement_month and settlement_month.strip():
        stmt = stmt.where(ChannelRecord.settlement_month == settlement_month.strip())
    if channel_name and channel_name.strip():
        stmt = stmt.where(ChannelRecord.channel_name.ilike(f"%{channel_name.strip()}%"))
    if game_name and game_name.strip():
        t = f"%{game_name.strip()}%"
        stmt = stmt.where(
            exists(
                select(ChannelRecordLineItem.id).where(
                    ChannelRecordLineItem.channel_record_id == ChannelRecord.id,
                    ChannelRecordLineItem.game_name.ilike(t),
                )
            )
        )
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
    base = select(ChannelRecord).options(selectinload(ChannelRecord.line_items))
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
    return ChannelRecordListResponse(items=[_to_read(r) for r in rows], total=total)


@router.post("/receipt-attachment", status_code=status.HTTP_201_CREATED)
async def upload_channel_receipt_attachment(file: UploadFile = File(...)) -> dict[str, str]:
    """银行回单等附件；multipart 字段名 file。返回相对 URL 写入 channel_receipts.attachment_url。"""
    orig = Path(file.filename or "file").name
    if not orig or orig in (".", ".."):
        orig = "file"
    filename = f"{uuid4().hex}_{orig}"
    file_path = UPLOAD_DIR / filename
    with open(file_path, "wb") as out:
        shutil.copyfileobj(file.file, out)
    return {"url": f"/uploads/channel_receipts/{filename}"}


@router.get("/{record_id}", response_model=ChannelRecordRead)
def get_channel_record(record_id: str, db: Session = Depends(get_db)) -> ChannelRecordRead:
    row = db.execute(
        select(ChannelRecord)
        .options(selectinload(ChannelRecord.line_items))
        .where(ChannelRecord.id == record_id)
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "id": record_id},
        )
    return _to_read(row)


@router.post(
    "/{record_id}/receipts",
    response_model=ChannelRecordRead,
    status_code=status.HTTP_201_CREATED,
)
def create_channel_receipt(
    record_id: str,
    payload: ChannelReceiptCreate,
    db: Session = Depends(get_db),
) -> ChannelRecordRead:
    row = db.get(ChannelRecord, record_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "id": record_id},
        )
    data = payload.model_dump()
    if not data.get("receipt_date") or not str(data["receipt_date"]).strip():
        data["receipt_date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    rec = ChannelReceipt(
        id=str(uuid4()),
        channel_record_id=record_id,
        amount=data["amount"],
        receipt_date=data.get("receipt_date"),
        bank_account=data.get("bank_account"),
        remark=data.get("remark"),
        attachment_url=data.get("attachment_url"),
    )
    db.add(rec)
    row.updated_at = datetime.now(timezone.utc)
    db.flush()
    _recompute_receipt_rollup(db, row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail={"error": "conflict"}) from None
    row = db.execute(
        select(ChannelRecord)
        .options(selectinload(ChannelRecord.line_items))
        .where(ChannelRecord.id == record_id)
    ).scalar_one()
    return _to_read(row)


@router.post("", response_model=ChannelRecordRead, status_code=status.HTTP_201_CREATED)
def create_channel_record(
    payload: ChannelRecordCreate, db: Session = Depends(get_db)
) -> ChannelRecordRead:
    if not payload.items:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": "items_required", "message": "至少录入一行游戏明细"},
        )
    header = payload.model_dump(exclude={"items"})
    row = ChannelRecord(id=str(uuid4()), **header)
    db.add(row)
    db.flush()
    _replace_line_items(db, row.id, payload.items)
    _sync_denormalized_totals(row, db)
    _recompute_receipt_rollup(db, row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail={"error": "conflict"}) from None
    row = db.execute(
        select(ChannelRecord)
        .options(selectinload(ChannelRecord.line_items))
        .where(ChannelRecord.id == row.id)
    ).scalar_one()
    return _to_read(row)


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
    data = payload.model_dump(exclude_unset=True)
    items_payload = data.pop("items", None)
    for key, value in data.items():
        setattr(row, key, value)
    row.updated_at = datetime.now(timezone.utc)
    if items_payload is not None:
        if not items_payload:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"error": "items_required", "message": "至少保留一行游戏明细"},
            )
        _replace_line_items(db, record_id, [ChannelLineItemCreate(**x) for x in items_payload])
        _sync_denormalized_totals(row, db)
    _recompute_receipt_rollup(db, row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail={"error": "conflict"}) from None
    row = db.execute(
        select(ChannelRecord)
        .options(selectinload(ChannelRecord.line_items))
        .where(ChannelRecord.id == record_id)
    ).scalar_one()
    return _to_read(row)


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
