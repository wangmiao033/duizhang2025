"""回款登记（快递/寄送）ORM 模型。"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base


class PaymentRecord(Base):
    __tablename__ = "payment_records"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    delivery_no: Mapped[str | None] = mapped_column(String, nullable=True)
    company: Mapped[str | None] = mapped_column(String, nullable=True)
    recipient: Mapped[str | None] = mapped_column(String, nullable=True)
    recipient_phone: Mapped[str | None] = mapped_column(String, nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    partner_id: Mapped[str | None] = mapped_column(String, nullable=True)
    customer: Mapped[str | None] = mapped_column(String, nullable=True)
    expected_date: Mapped[str | None] = mapped_column(String, nullable=True)
    send_date: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str | None] = mapped_column(String, nullable=True, default="待寄出")
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
