"""付款流水单 API模型。"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BankPaymentUpsert(BaseModel):
    transaction_serial: str | None = None
    authorization_status: str | None = None
    remittance_amount: float = 0
    remittance_purpose: str | None = None
    payment_remark: str | None = None
    is_scheduled: bool = False
    payment_date: str | None = None
    transfer_status: str = Field(default="pending_submit", description="pending_submit|submitted|paid|failed")
    remitter_company: str | None = None
    remitter_account: str | None = None
    remitter_bank_name: str | None = None
    payee_company: str | None = None
    payee_account: str | None = None
    payee_bank_name: str | None = None
    submitter_user_id: str | None = None
    first_approver_user_id: str | None = None
    first_approval_at: datetime | None = None
    bank_feedback: str | None = None
    instruction_channel: str | None = None
    is_personal_payee: bool = False


class BankPaymentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    reconciliation_id: str
    transaction_serial: str | None
    authorization_status: str | None
    remittance_amount: float
    remittance_purpose: str | None
    payment_remark: str | None
    is_scheduled: bool
    payment_date: str | None
    transfer_status: str
    remitter_company: str | None
    remitter_account: str | None
    remitter_bank_name: str | None
    payee_company: str | None
    payee_account: str | None
    payee_bank_name: str | None
    submitter_user_id: str | None
    first_approver_user_id: str | None
    first_approval_at: datetime | None
    bank_feedback: str | None
    instruction_channel: str | None
    is_personal_payee: bool
    created_at: datetime
    updated_at: datetime
