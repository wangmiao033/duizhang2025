"""QuickSDK流水库 API 模型。"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class QuickSdkBatchRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    source_file: str | None
    settlement_month: str | None
    row_count: int
    game_count: int
    channel_count: int
    total_flow: float
    note: str | None
    imported_at: datetime


class QuickSdkBatchListResponse(BaseModel):
    items: list[QuickSdkBatchRead]
    total: int


class QuickSdkSummaryResponse(BaseModel):
    batch_count: int = 0
    row_count: int = 0
    game_count: int = 0
    channel_count: int = 0
    total_flow: float = 0


class QuickSdkGameFlowResponse(BaseModel):
    game_name: str
    settlement_month: str | None = None
    row_count: int = 0
    channel_count: int = 0
    source_game_count: int = 0
    total_flow: float = 0
    top_channel: str | None = None
    top_channel_flow: float = 0


class QuickSdkRdLineSuggestion(BaseModel):
    game_name: str = Field(description="研发账单使用的产品/项目组名称")
    settlement_month: str | None = None
    row_count: int = 0
    channel_count: int = 0
    source_game_count: int = 0
    total_flow: float = 0
    top_channel: str | None = None
    top_channel_flow: float = 0


class QuickSdkRdLineListResponse(BaseModel):
    items: list[QuickSdkRdLineSuggestion]
    total: int
