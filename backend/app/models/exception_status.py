"""异常处理状态 ORM（与前端 makeExceptionId 对应）。"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base


class ExceptionStatus(Base):
    __tablename__ = "exception_statuses"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    exception_id: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    status: Mapped[str] = mapped_column(String, nullable=False, server_default="pending")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
