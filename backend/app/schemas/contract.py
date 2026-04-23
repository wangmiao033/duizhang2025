"""合同管理 API 模型。"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ContractRecordCreate(BaseModel):
    signing_date: str | None = None
    channel: str | None = None
    platform: str | None = None
    address: str | None = None
    valid_period: str | None = None
    game: str | None = None
    channel_share: str | None = None
    issue_share: str | None = None
    channel_fee: str | None = None
    remark: str | None = None


class ContractRecordUpdate(BaseModel):
    signing_date: str | None = None
    channel: str | None = None
    platform: str | None = None
    address: str | None = None
    valid_period: str | None = None
    game: str | None = None
    channel_share: str | None = None
    issue_share: str | None = None
    channel_fee: str | None = None
    remark: str | None = None


class ContractRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    signing_date: str | None
    channel: str | None
    platform: str | None
    address: str | None
    valid_period: str | None
    game: str | None
    channel_share: str | None
    issue_share: str | None
    channel_fee: str | None
    remark: str | None
    created_at: datetime
    updated_at: datetime


class ContractRecordListResponse(BaseModel):
    items: list[ContractRecordRead]
    total: int
