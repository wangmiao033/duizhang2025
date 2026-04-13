"""研发对账关联的付款流水单（打款登记）。"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base


class BankPaymentRecord(Base):
    __tablename__ = "bank_payment_records"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    reconciliation_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("reconciliation_records.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    transaction_serial: Mapped[str | None] = mapped_column(String, nullable=True)
    authorization_status: Mapped[str | None] = mapped_column(String, nullable=True)
    remittance_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    remittance_purpose: Mapped[str | None] = mapped_column(Text, nullable=True)
    payment_remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_scheduled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    payment_date: Mapped[str | None] = mapped_column(String, nullable=True)
    transfer_status: Mapped[str] = mapped_column(String, nullable=False, default="pending_submit")
    remitter_company: Mapped[str | None] = mapped_column(Text, nullable=True)
    remitter_account: Mapped[str | None] = mapped_column(String, nullable=True)
    remitter_bank_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    payee_company: Mapped[str | None] = mapped_column(Text, nullable=True)
    payee_account: Mapped[str | None] = mapped_column(String, nullable=True)
    payee_bank_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitter_user_id: Mapped[str | None] = mapped_column(String, nullable=True)
    first_approver_user_id: Mapped[str | None] = mapped_column(String, nullable=True)
    first_approval_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    bank_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    instruction_channel: Mapped[str | None] = mapped_column(String, nullable=True)
    is_personal_payee: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
