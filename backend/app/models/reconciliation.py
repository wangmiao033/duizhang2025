"""研发对账 ORM 模型。"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base


class ReconciliationRecord(Base):
    __tablename__ = "reconciliation_records"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    statement_no: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    settlement_month: Mapped[str | None] = mapped_column(String, nullable=True)
    partner_name: Mapped[str | None] = mapped_column(String, nullable=True)
    game_name: Mapped[str | None] = mapped_column(String, nullable=True)
    game_flow: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    test_cost: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    voucher_cost: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    channel_fee_rate: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False, default=0)
    tax_rate: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False, default=0)
    revenue_share_rate: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False, default=0)
    discount_value: Mapped[float] = mapped_column(Numeric(18, 6), nullable=False, default=1)
    refund_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    settlement_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    status: Mapped[str | None] = mapped_column(String, nullable=True, default="pending")
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
