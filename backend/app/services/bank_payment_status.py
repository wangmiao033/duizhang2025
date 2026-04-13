"""列表「付款状态」与金额比对规则（与前端展示一致）。"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.bank_payment import BankPaymentRecord

EPS = 0.01


def compute_bank_payment_list_status(
    settlement_amount: float,
    bp: BankPaymentRecord | None,
) -> str:
    """列表列：未登记 / 待打款 / 已提交 / 已付款 / 金额异常 / 打款失败。"""
    if bp is None:
        return "未登记"
    st = (bp.transfer_status or "pending_submit").strip().lower()
    rem = float(bp.remittance_amount or 0)
    pay = float(settlement_amount or 0)

    def amount_mismatch() -> bool:
        return abs(rem - pay) > EPS

    if st == "failed":
        return "打款失败"
    if st in ("paid", "submitted") and amount_mismatch():
        return "金额异常"
    if st == "paid":
        return "已付款"
    if st == "submitted":
        return "已提交"
    return "待打款"
