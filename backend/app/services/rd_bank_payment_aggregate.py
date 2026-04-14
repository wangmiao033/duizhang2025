"""研发对账与 bank_transactions（付款登记）关联金额的聚合。"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.bank_transaction import BankTransaction

EPS = Decimal("0.005")
RD_TYPE = "rd"


@dataclass
class RdPaymentAggregate:
    paid_amount: Decimal
    unpaid_amount: Decimal
    payment_status: str
    payment_count: int
    latest_payment_date: str | None


def _payable_decimal(settlement_amount: Any) -> Decimal:
    try:
        return Decimal(str(settlement_amount or 0))
    except Exception:
        return Decimal("0")


def _compute_status(payable: Decimal, paid: Decimal) -> str:
    if paid <= EPS:
        return "未付款"
    if paid + EPS < payable:
        return "部分付款"
    return "已付款"


def aggregate_rd_payments_for_ids(
    db: Session, reconciliation_ids: list[str]
) -> dict[str, RdPaymentAggregate]:
    """按研发对账 id 聚合已关联的付款登记（type=payment_register, reconciliation_type=rd）。"""
    if not reconciliation_ids:
        return {}

    paid_expr = func.coalesce(BankTransaction.linked_amount, BankTransaction.amount, 0)

    stmt = (
        select(
            BankTransaction.reconciliation_id,
            func.coalesce(func.sum(paid_expr), 0).label("paid_sum"),
            func.count(BankTransaction.id).label("cnt"),
            func.max(BankTransaction.created_at).label("latest_at"),
        )
        .where(
            BankTransaction.type == "payment_register",
            BankTransaction.reconciliation_id.in_(reconciliation_ids),
            BankTransaction.reconciliation_type == RD_TYPE,
        )
        .group_by(BankTransaction.reconciliation_id)
    )

    rows = db.execute(stmt).all()
    out: dict[str, RdPaymentAggregate] = {}
    for rec_id, paid_sum, cnt, latest_at in rows:
        if not rec_id:
            continue
        sid = str(rec_id)
        paid = Decimal(str(paid_sum or 0))
        cnt_int = int(cnt or 0)
        latest_str: str | None = None
        if latest_at is not None:
            if isinstance(latest_at, datetime):
                latest_str = latest_at.date().isoformat()
            elif isinstance(latest_at, date):
                latest_str = latest_at.isoformat()
        #占位：payable 在列表层按行填入
        out[sid] = RdPaymentAggregate(
            paid_amount=paid,
            unpaid_amount=Decimal("0"),
            payment_status="未付款",
            payment_count=cnt_int,
            latest_payment_date=latest_str,
        )
    return out


def fill_payable_for_row(
    agg: RdPaymentAggregate | None, settlement_amount: Any
) -> RdPaymentAggregate:
    payable = _payable_decimal(settlement_amount)
    if agg is None:
        paid = Decimal("0")
        return RdPaymentAggregate(
            paid_amount=paid,
            unpaid_amount=max(Decimal("0"), payable - paid),
            payment_status=_compute_status(payable, paid),
            payment_count=0,
            latest_payment_date=None,
        )
    paid = agg.paid_amount
    unpaid = max(Decimal("0"), payable - paid)
    return RdPaymentAggregate(
        paid_amount=paid,
        unpaid_amount=unpaid,
        payment_status=_compute_status(payable, paid),
        payment_count=agg.payment_count,
        latest_payment_date=agg.latest_payment_date,
    )
