"""渠道对账 API 模型。"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ChannelRecordCreate(BaseModel):
    channel_name: str | None = None
    game_name: str | None = None
    settlement_month: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    billing_flow: float = 0
    voucher_cost: float = 0
    no_worry_cost: float = 0
    refund_cost: float = 0
    test_cost: float = 0
    welfare_cost: float = 0
    share_rate: float = 0
    billing_amount: float = 0
    share_amount: float = 0
    tax_rate: float = 0
    gateway_cost: float = 0
    settlement_amount: float = 0
    status: str | None = "pending"
    remark: str | None = None
    server_cost: float | None = None
    discount_type: str | None = None
    channel_fee_rate: float | None = None
    dev_share_rate: float | None = None
    profit_rate: float | None = None


class ChannelRecordUpdate(BaseModel):
    channel_name: str | None = None
    game_name: str | None = None
    settlement_month: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    billing_flow: float | None = None
    voucher_cost: float | None = None
    no_worry_cost: float | None = None
    refund_cost: float | None = None
    test_cost: float | None = None
    welfare_cost: float | None = None
    share_rate: float | None = None
    billing_amount: float | None = None
    share_amount: float | None = None
    tax_rate: float | None = None
    gateway_cost: float | None = None
    settlement_amount: float | None = None
    status: str | None = None
    remark: str | None = None
    server_cost: float | None = None
    discount_type: str | None = None
    channel_fee_rate: float | None = None
    dev_share_rate: float | None = None
    profit_rate: float | None = None


class ChannelRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    channel_name: str | None
    game_name: str | None
    settlement_month: str | None
    start_date: str | None
    end_date: str | None
    billing_flow: float
    voucher_cost: float
    no_worry_cost: float
    refund_cost: float
    test_cost: float
    welfare_cost: float
    share_rate: float
    billing_amount: float
    share_amount: float
    tax_rate: float
    gateway_cost: float
    settlement_amount: float
    status: str | None
    remark: str | None
    server_cost: float | None
    discount_type: str | None
    channel_fee_rate: float | None
    dev_share_rate: float | None
    profit_rate: float | None
    created_at: datetime
    updated_at: datetime


class ChannelRecordListResponse(BaseModel):
    items: list[ChannelRecordRead]
    total: int
