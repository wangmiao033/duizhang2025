"""发票 API 模型。"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class InvoiceRecordCreate(BaseModel):
    title: str | None = None
    tax_no: str | None = None
    invoice_amount: float = 0
    invoice_date: str | None = None
    status: str | None = "未开"
    remark: str | None = None
    verified: bool = False
    verified_amount: float = 0
    verified_record_ids: list[str] = Field(default_factory=list)


class InvoiceRecordUpdate(BaseModel):
    title: str | None = None
    tax_no: str | None = None
    invoice_amount: float | None = None
    invoice_date: str | None = None
    status: str | None = None
    remark: str | None = None
    verified: bool | None = None
    verified_amount: float | None = None
    verified_record_ids: list[str] | None = None


class InvoiceRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str | None
    tax_no: str | None
    invoice_amount: float
    invoice_date: str | None
    status: str | None
    remark: str | None
    verified: bool
    verified_amount: float
    verified_record_ids: list[str]
    created_at: datetime
    updated_at: datetime

    @field_validator("verified_record_ids", mode="before")
    @classmethod
    def _coerce_verified_ids(cls, v: object) -> list[str]:
        if v is None:
            return []
        if isinstance(v, list):
            return [str(x) for x in v if x is not None]
        return []


class InvoiceRecordListResponse(BaseModel):
    items: list[InvoiceRecordRead]
    total: int
