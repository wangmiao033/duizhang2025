"""合同管理 ORM 模型。"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base


class ContractRecord(Base):
    __tablename__ = "contract_records"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    signing_date: Mapped[str | None] = mapped_column(String, nullable=True)
    channel: Mapped[str | None] = mapped_column(String, nullable=True)
    platform: Mapped[str | None] = mapped_column(String, nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    valid_period: Mapped[str | None] = mapped_column(String, nullable=True)
    game: Mapped[str | None] = mapped_column(String, nullable=True)
    channel_share: Mapped[str | None] = mapped_column(String, nullable=True)
    issue_share: Mapped[str | None] = mapped_column(String, nullable=True)
    channel_fee: Mapped[str | None] = mapped_column(String, nullable=True)
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
