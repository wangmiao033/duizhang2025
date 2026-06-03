"""QuickSDK流水库 ORM 模型。"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base


class QuickSdkImportBatch(Base):
    __tablename__ = "quicksdk_import_batches"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    source_file: Mapped[str | None] = mapped_column(String, nullable=True)
    settlement_month: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    row_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    game_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    channel_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_flow: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    imported_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    flows: Mapped[list["QuickSdkFlow"]] = relationship(
        "QuickSdkFlow",
        back_populates="batch",
        cascade="all, delete-orphan",
    )


class QuickSdkFlow(Base):
    __tablename__ = "quicksdk_flows"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    batch_id: Mapped[str] = mapped_column(
        String, ForeignKey("quicksdk_import_batches.id", ondelete="CASCADE"), nullable=False, index=True
    )
    flow_date: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    settlement_month: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    game_name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    channel_name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    gross_flow: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    batch: Mapped["QuickSdkImportBatch"] = relationship(
        "QuickSdkImportBatch", back_populates="flows"
    )
