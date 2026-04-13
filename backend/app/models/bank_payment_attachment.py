"""付款流水单附件。"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base


class BankPaymentAttachment(Base):
    __tablename__ = "bank_payment_attachments"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    bank_payment_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("bank_payment_records.id", ondelete="CASCADE"),
        nullable=False,
    )
    file_name: Mapped[str] = mapped_column(Text, nullable=False)
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    file_type: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
