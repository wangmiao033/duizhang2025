"""渠道对账 ORM：主表（公共信息）+ 明细行（按游戏）。"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base


class ChannelRecord(Base):
    __tablename__ = "channel_records"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    channel_name: Mapped[str | None] = mapped_column(String, nullable=True)
    partner_name: Mapped[str | None] = mapped_column(String, nullable=True)
    game_name: Mapped[str | None] = mapped_column(String, nullable=True)
    settlement_month: Mapped[str | None] = mapped_column(String, nullable=True)
    start_date: Mapped[str | None] = mapped_column(String, nullable=True)
    end_date: Mapped[str | None] = mapped_column(String, nullable=True)
    billing_flow: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    voucher_cost: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    no_worry_cost: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    refund_cost: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    test_cost: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    welfare_cost: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    share_rate: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False, default=0)
    billing_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    share_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    tax_rate: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False, default=0)
    gateway_cost: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    settlement_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    received_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    receipt_status: Mapped[str] = mapped_column(String(32), nullable=False, default="unpaid")
    status: Mapped[str | None] = mapped_column(String, nullable=True, default="pending")
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    server_cost: Mapped[float | None] = mapped_column(Numeric(18, 2), nullable=True)
    discount_type: Mapped[str | None] = mapped_column(String, nullable=True)
    channel_fee_rate: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)
    dev_share_rate: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)
    profit_rate: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    line_items: Mapped[list["ChannelRecordLineItem"]] = relationship(
        "ChannelRecordLineItem",
        back_populates="parent",
        cascade="all, delete-orphan",
        order_by="ChannelRecordLineItem.sort_order",
    )
    receipts: Mapped[list["ChannelReceipt"]] = relationship(
        "ChannelReceipt",
        back_populates="channel_record",
        cascade="all, delete-orphan",
    )


class ChannelRecordLineItem(Base):
    __tablename__ = "channel_record_line_items"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    channel_record_id: Mapped[str] = mapped_column(
        String, ForeignKey("channel_records.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    game_name: Mapped[str | None] = mapped_column(String, nullable=True)
    billing_flow: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    discount_factor: Mapped[float] = mapped_column(Numeric(12, 6), nullable=False, default=1)
    voucher_cost: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    no_worry_cost: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    refund_cost: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    test_cost: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    welfare_cost: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    share_rate: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False, default=0)
    billing_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    share_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    tax_rate: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False, default=0)
    gateway_cost: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    settlement_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    parent: Mapped[ChannelRecord] = relationship("ChannelRecord", back_populates="line_items")


class ChannelReceipt(Base):
    """渠道对账单笔收款明细。"""

    __tablename__ = "channel_receipts"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    channel_record_id: Mapped[str] = mapped_column(
        String, ForeignKey("channel_records.id", ondelete="CASCADE"), nullable=False, index=True
    )
    amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    receipt_date: Mapped[str | None] = mapped_column(String(32), nullable=True)
    bank_account: Mapped[str | None] = mapped_column(String(512), nullable=True)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    attachment_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    channel_record: Mapped[ChannelRecord] = relationship("ChannelRecord", back_populates="receipts")
