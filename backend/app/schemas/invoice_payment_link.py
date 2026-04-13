"""发票-回款关联 API 模型。"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class InvoicePaymentLinkCreate(BaseModel):
    invoice_id: str
    payment_id: str
    match_type: str = "manual"
    match_score: float = 0.0
    note: str | None = None


class InvoicePaymentLinkRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    invoice_id: str
    payment_id: str
    match_type: str
    match_score: float
    note: str | None
    created_at: datetime
    updated_at: datetime


class InvoicePaymentLinkListResponse(BaseModel):
    items: list[InvoicePaymentLinkRead]
    total: int


class AutoMatchScores(BaseModel):
    text: float = Field(description="抬头/对方文本相似度分量 0~1")
    amount: float = Field(description="金额匹配分量")
    date: float = Field(description="日期接近分量")


class AutoMatchCandidate(BaseModel):
    invoice_id: str
    payment_id: str
    match_score: float
    scores: AutoMatchScores
    invoice_title: str | None = None
    payment_summary: str | None = None


class AutoMatchRequest(BaseModel):
    min_score: float = Field(default=0.55, ge=0.0, le=1.0)
    limit: int = Field(default=200, ge=1, le=2000)


class AutoMatchResponse(BaseModel):
    candidates: list[AutoMatchCandidate]
