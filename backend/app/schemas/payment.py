"""回款登记 API 模型。"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PaymentRecordCreate(BaseModel):
    delivery_no: str | None = None
    company: str | None = None
    recipient: str | None = None
    customer: str | None = None
    send_date: str | None = None
    status: str | None = "待寄出"
    remark: str | None = None


class PaymentRecordUpdate(BaseModel):
    delivery_no: str | None = None
    company: str | None = None
    recipient: str | None = None
    customer: str | None = None
    send_date: str | None = None
    status: str | None = None
    remark: str | None = None


class PaymentRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    delivery_no: str | None
    company: str | None
    recipient: str | None
    customer: str | None
    send_date: str | None
    status: str | None
    remark: str | None
    created_at: datetime
    updated_at: datetime


class PaymentRecordListResponse(BaseModel):
    items: list[PaymentRecordRead]
    total: int
