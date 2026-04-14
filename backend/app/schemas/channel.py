"""渠道对账 API 模型：主表 + 明细 items。"""

from __future__ import annotations

from datetime import datetime

from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field


class ChannelReceiptCreate(BaseModel):
    amount: float = Field(gt=0, description="收款金额，须大于 0")
    receipt_date: str | None = None
    bank_account: str | None = None
    remark: str | None = None
    attachment_url: str | None = None


class ChannelReceiptRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    channel_record_id: str
    amount: float
    receipt_date: str | None
    bank_account: str | None
    remark: str | None
    attachment_url: str | None
    created_at: datetime


class ChannelReceiptListResponse(BaseModel):
    items: list[ChannelReceiptRead]


class ChannelLineItemCreate(BaseModel):
    """单行游戏明细；金额字段与 ORM 一致（支付通道费为 gateway_cost 绝对金额）。"""

    game_name: str | None = None
    billing_flow: float = 0
    discount_factor: float = 1
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


class ChannelLineItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    channel_record_id: str
    sort_order: int
    game_name: str | None
    billing_flow: float
    discount_factor: float = 1
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
    created_at: datetime
    updated_at: datetime


class ChannelRecordCreate(BaseModel):
    channel_name: str | None = None
    partner_name: str | None = None
    settlement_month: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    remark: str | None = None
    status: str | None = "pending"
    server_cost: float | None = None
    discount_type: str | None = None
    channel_fee_rate: float | None = None
    dev_share_rate: float | None = None
    profit_rate: float | None = None
    items: Annotated[list[ChannelLineItemCreate], Field(min_length=1)]


class ChannelRecordUpdate(BaseModel):
    channel_name: str | None = None
    partner_name: str | None = None
    settlement_month: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    remark: str | None = None
    status: str | None = None
    server_cost: float | None = None
    discount_type: str | None = None
    channel_fee_rate: float | None = None
    dev_share_rate: float | None = None
    profit_rate: float | None = None
    items: list[ChannelLineItemCreate] | None = None


class ChannelRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    channel_name: str | None
    partner_name: str | None
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
    received_amount: float = 0
    receipt_status: str = "unpaid"
    status: str | None
    remark: str | None
    server_cost: float | None
    discount_type: str | None
    channel_fee_rate: float | None
    dev_share_rate: float | None
    profit_rate: float | None
    created_at: datetime
    updated_at: datetime
    items: list[ChannelLineItemRead] = Field(default_factory=list)


class ChannelRecordListResponse(BaseModel):
    items: list[ChannelRecordRead]
    total: int
