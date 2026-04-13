"""银行流水台账 API模型。"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

BankTransactionType = Literal["statement_import", "payment_register", "collection_register"]


class BankTransactionCreate(BaseModel):
    type: BankTransactionType
    trade_date: str | None = None
    bank_account: str | None = None
    payer_name: str | None = None
    payer_account: str | None = None
    payer_bank_name: str | None = None
    payee_name: str | None = None
    payee_account: str | None = None
    payee_bank_name: str | None = None
    amount: Decimal | None = None
    income_amount: Decimal | None = None
    expense_amount: Decimal | None = None
    currency: str | None = Field(default="CNY")
    transaction_no: str | None = None
    instruction_no: str | None = None
    summary: str | None = None
    purpose: str | None = None
    remark: str | None = None
    status: str | None = None
    raw_text: str | None = None
    attachment_url: str | None = None


class BankTransactionUpdate(BaseModel):
    type: BankTransactionType | None = None
    trade_date: str | None = None
    bank_account: str | None = None
    payer_name: str | None = None
    payer_account: str | None = None
    payer_bank_name: str | None = None
    payee_name: str | None = None
    payee_account: str | None = None
    payee_bank_name: str | None = None
    amount: Decimal | None = None
    income_amount: Decimal | None = None
    expense_amount: Decimal | None = None
    currency: str | None = None
    transaction_no: str | None = None
    instruction_no: str | None = None
    summary: str | None = None
    purpose: str | None = None
    remark: str | None = None
    status: str | None = None
    raw_text: str | None = None
    attachment_url: str | None = None


class BankTransactionRead(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    type: str
    trade_date: str | None
    bank_account: str | None
    payer_name: str | None
    payer_account: str | None
    payer_bank_name: str | None
    payee_name: str | None
    payee_account: str | None
    payee_bank_name: str | None
    amount: Decimal | None
    income_amount: Decimal | None
    expense_amount: Decimal | None
    currency: str | None
    transaction_no: str | None
    instruction_no: str | None
    summary: str | None
    purpose: str | None
    remark: str | None
    status: str | None
    raw_text: str | None
    attachment_url: str | None
    created_at: datetime
    updated_at: datetime


class BankTransactionListResponse(BaseModel):
    items: list[BankTransactionRead]
    total: int
