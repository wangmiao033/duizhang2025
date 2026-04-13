"""异常状态 API 模型。"""

from __future__ import annotations

from datetime import datetime

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ExceptionStatusUpsert(BaseModel):
    exception_id: str = Field(..., min_length=1)
    status: Literal["pending", "ignored", "resolved"]


class ExceptionStatusRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    exception_id: str
    status: str
    updated_at: datetime


class ExceptionStatusListResponse(BaseModel):
    items: list[ExceptionStatusRead]
    total: int
