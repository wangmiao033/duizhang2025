"""研发对账 API 模型。"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.bank_transaction import BankTransactionRead


class ReconciliationCreate(BaseModel):
    statement_no: str | None = Field(
        default=None,
        description="结算单编号；为空时由服务端生成占位编号",
    )
    settlement_month: str | None = None
    partner_name: str | None = None
    game_name: str | None = None
    game_flow: float = 0
    test_cost: float = 0
    voucher_cost: float = 0
    channel_fee_rate: float = 0
    tax_rate: float = 0
    revenue_share_rate: float = 0
    discount_value: float = 1
    refund_amount: float = 0
    settlement_amount: float = 0
    status: str | None = "pending"
    remark: str | None = None


class ReconciliationUpdate(BaseModel):
    statement_no: str | None = None
    settlement_month: str | None = None
    partner_name: str | None = None
    game_name: str | None = None
    game_flow: float | None = None
    test_cost: float | None = None
    voucher_cost: float | None = None
    channel_fee_rate: float | None = None
    tax_rate: float | None = None
    revenue_share_rate: float | None = None
    discount_value: float | None = None
    refund_amount: float | None = None
    settlement_amount: float | None = None
    status: str | None = None
    remark: str | None = None


class ReconciliationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    statement_no: str
    settlement_month: str | None
    partner_name: str | None
    game_name: str | None
    game_flow: float
    test_cost: float
    voucher_cost: float
    channel_fee_rate: float
    tax_rate: float
    revenue_share_rate: float
    discount_value: float
    refund_amount: float
    settlement_amount: float
    status: str | None
    remark: str | None
    created_at: datetime
    updated_at: datetime
    bank_payment_list_status: str | None = None
    paid_amount: float = 0
    unpaid_amount: float = 0
    payment_status: str = "未付款"
    payment_count: int = 0
    latest_payment_date: str | None = None


class ReconciliationListResponse(BaseModel):
    items: list[ReconciliationRead]
    total: int


class ReconciliationPaymentsResponse(BaseModel):
    items: list[BankTransactionRead]
    total: int
