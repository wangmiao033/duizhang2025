"""发票与回款关联 ORM。"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base


class InvoicePaymentLink(Base):
    __tablename__ = "invoice_payment_links"
    __table_args__ = (UniqueConstraint("invoice_id", "payment_id", name="uq_invoice_payment_links_pair"),)

    id: Mapped[str] = mapped_column(String, primary_key=True)
    invoice_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    payment_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    match_type: Mapped[str] = mapped_column(String, nullable=False, server_default="manual")
    match_score: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False, server_default="0")
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
