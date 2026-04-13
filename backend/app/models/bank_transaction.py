"""银行流水统一台账（导入 / 付款登记 / 回款登记）。"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base


class BankTransaction(Base):
    __tablename__ = "bank_transactions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    type: Mapped[str] = mapped_column(String, nullable=False)
    trade_date: Mapped[str | None] = mapped_column(String, nullable=True)
    bank_account: Mapped[str | None] = mapped_column(String, nullable=True)
    payer_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    payer_account: Mapped[str | None] = mapped_column(String, nullable=True)
    payer_bank_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    payee_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    payee_account: Mapped[str | None] = mapped_column(String, nullable=True)
    payee_bank_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    amount: Mapped[float | None] = mapped_column(Numeric(18, 2), nullable=True)
    income_amount: Mapped[float | None] = mapped_column(Numeric(18, 2), nullable=True)
    expense_amount: Mapped[float | None] = mapped_column(Numeric(18, 2), nullable=True)
    currency: Mapped[str | None] = mapped_column(String, nullable=True)
    transaction_no: Mapped[str | None] = mapped_column(String, nullable=True)
    instruction_no: Mapped[str | None] = mapped_column(String, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    purpose: Mapped[str | None] = mapped_column(Text, nullable=True)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str | None] = mapped_column(String, nullable=True)
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    attachment_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
