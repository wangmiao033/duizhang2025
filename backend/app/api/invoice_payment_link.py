"""发票与回款关联 API。"""

from __future__ import annotations

import json
import re
from datetime import date, datetime
from difflib import SequenceMatcher
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.invoice import InvoiceRecord
from app.models.invoice_payment_link import InvoicePaymentLink
from app.models.payment import PaymentRecord
from app.schemas.invoice_payment_link import (
    AutoMatchCandidate,
    AutoMatchRequest,
    AutoMatchResponse,
    AutoMatchScores,
    InvoicePaymentLinkCreate,
    InvoicePaymentLinkListResponse,
    InvoicePaymentLinkRead,
)

router = APIRouter()


def _payment_remark_plain(remark: str | None) -> str:
    if not remark:
        return ""
    try:
        o = json.loads(remark)
        if isinstance(o, dict) and o.get("v") == 1:
            parts = [o.get("t"), o.get("address")]
            return " ".join(str(p) for p in parts if p)
    except (json.JSONDecodeError, TypeError):
        pass
    return str(remark)


def _payment_blob(p: PaymentRecord) -> str:
    parts = [
        p.company or "",
        p.customer or "",
        p.recipient or "",
        _payment_remark_plain(p.remark),
    ]
    return " ".join(x.strip() for x in parts if x and str(x).strip())


def _norm_compact(s: str | None) -> str:
    if not s:
        return ""
    return "".join((s or "").split()).lower()


def _text_score(invoice_title: str | None, payment_blob: str) -> float:
    a, b = _norm_compact(invoice_title), _norm_compact(payment_blob)
    if not a or not b:
        return 0.25
    if a in b or b in a:
        return 1.0
    return float(SequenceMatcher(None, a, b).ratio())


def _extract_amount_candidates(text: str) -> list[float]:
    if not text:
        return []
    t = text.replace(",", "").replace("，", "")
    out: list[float] = []
    for m in re.finditer(r"(?:¥|￥|元|^|[\s:：，,])\s*(\d+(?:\.\d+)?)", t):
        try:
            out.append(float(m.group(1)))
        except ValueError:
            continue
    return out


def _amount_score(invoice_amount: float, payment: PaymentRecord) -> float:
    blob = _payment_blob(payment)
    amounts = _extract_amount_candidates(blob)
    if not amounts:
        return 0.45
    best = min(abs(invoice_amount - a) for a in amounts)
    denom = max(abs(invoice_amount), 0.01)
    rel = best / denom
    if rel < 0.005:
        return 1.0
    if rel < 0.02:
        return 0.88
    if rel < 0.05:
        return 0.65
    if rel < 0.12:
        return 0.4
    return 0.15


def _parse_loose_date(raw: str | None) -> date | None:
    if not raw or not str(raw).strip():
        return None
    s = str(raw).strip().split()[0].replace("/", "-").replace(".", "-")[:10]
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except ValueError:
        return None


def _date_score(inv_date_s: str | None, pay_date_s: str | None) -> float:
    d1, d2 = _parse_loose_date(inv_date_s), _parse_loose_date(pay_date_s)
    if d1 is None or d2 is None:
        return 0.5
    days = abs((d1 - d2).days)
    if days <= 3:
        return 1.0
    if days <= 7:
        return 0.78
    if days <= 14:
        return 0.55
    if days <= 30:
        return 0.3
    return 0.1


def _combine_score(text_s: float, amt_s: float, date_s: float) -> float:
    return 0.42 * text_s + 0.33 * amt_s + 0.25 * date_s


@router.get("", response_model=InvoicePaymentLinkListResponse)
def list_invoice_payment_links(
    db: Session = Depends(get_db),
    invoice_id: str | None = Query(None),
    payment_id: str | None = Query(None),
    limit: int = Query(500, ge=1, le=1000),
    offset: int = Query(0, ge=0),
) -> InvoicePaymentLinkListResponse:
    base = select(InvoicePaymentLink)
    if invoice_id and invoice_id.strip():
        base = base.where(InvoicePaymentLink.invoice_id == invoice_id.strip())
    if payment_id and payment_id.strip():
        base = base.where(InvoicePaymentLink.payment_id == payment_id.strip())
    count_stmt = select(InvoicePaymentLink)
    if invoice_id and invoice_id.strip():
        count_stmt = count_stmt.where(InvoicePaymentLink.invoice_id == invoice_id.strip())
    if payment_id and payment_id.strip():
        count_stmt = count_stmt.where(InvoicePaymentLink.payment_id == payment_id.strip())
    total = len(db.execute(count_stmt).scalars().all())
    rows = (
        db.execute(base.order_by(InvoicePaymentLink.created_at.desc()).limit(limit).offset(offset))
        .scalars()
        .all()
    )
    return InvoicePaymentLinkListResponse(
        items=[InvoicePaymentLinkRead.model_validate(r) for r in rows],
        total=total,
    )


@router.post("", response_model=InvoicePaymentLinkRead, status_code=status.HTTP_201_CREATED)
def create_invoice_payment_link(
    payload: InvoicePaymentLinkCreate, db: Session = Depends(get_db)
) -> InvoicePaymentLinkRead:
    inv = db.get(InvoiceRecord, payload.invoice_id.strip())
    if inv is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "invoice_not_found", "id": payload.invoice_id},
        )
    pay = db.get(PaymentRecord, payload.payment_id.strip())
    if pay is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "payment_not_found", "id": payload.payment_id},
        )
    row = InvoicePaymentLink(
        id=str(uuid4()),
        invoice_id=payload.invoice_id.strip(),
        payment_id=payload.payment_id.strip(),
        match_type=(payload.match_type or "manual").strip() or "manual",
        match_score=payload.match_score,
        note=payload.note,
    )
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": "duplicate_link", "invoice_id": row.invoice_id, "payment_id": row.payment_id},
        )
    db.refresh(row)
    return InvoicePaymentLinkRead.model_validate(row)


@router.delete("/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice_payment_link(link_id: str, db: Session = Depends(get_db)) -> None:
    row = db.get(InvoicePaymentLink, link_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "id": link_id},
        )
    db.delete(row)
    db.commit()


@router.post("/auto-match", response_model=AutoMatchResponse)
def auto_match_invoice_payments(
    body: AutoMatchRequest, db: Session = Depends(get_db)
) -> AutoMatchResponse:
    invoices = db.execute(select(InvoiceRecord)).scalars().all()
    payments = db.execute(select(PaymentRecord)).scalars().all()
    links = db.execute(select(InvoicePaymentLink)).scalars().all()
    linked_pairs = {(l.invoice_id, l.payment_id) for l in links}

    candidates: list[AutoMatchCandidate] = []
    for inv in invoices:
        try:
            inv_amt = float(inv.invoice_amount or 0)
        except (TypeError, ValueError):
            inv_amt = 0.0
        for pay in payments:
            if (inv.id, pay.id) in linked_pairs:
                continue
            blob = _payment_blob(pay)
            ts = _text_score(inv.title, blob)
            ams = _amount_score(inv_amt, pay)
            ds = _date_score(inv.invoice_date, pay.send_date)
            total = _combine_score(ts, ams, ds)
            if total < body.min_score:
                continue
            summary_parts = [pay.delivery_no, pay.company, pay.customer]
            payment_summary = " · ".join(str(x) for x in summary_parts if x)
            candidates.append(
                AutoMatchCandidate(
                    invoice_id=inv.id,
                    payment_id=pay.id,
                    match_score=round(total, 4),
                    scores=AutoMatchScores(text=round(ts, 4), amount=round(ams, 4), date=round(ds, 4)),
                    invoice_title=inv.title,
                    payment_summary=payment_summary or None,
                )
            )

    candidates.sort(key=lambda c: c.match_score, reverse=True)
    return AutoMatchResponse(candidates=candidates[: body.limit])
