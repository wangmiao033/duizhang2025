"""研发对账明细行金额计算（与前端 calculateSettlementAmount.js 口径一致）。"""

from __future__ import annotations

import math


def compute_rd_line_amounts(
    revenue: float,
    discount_rate: float,
    test_fee: float,
    coupon_amount: float,
    extra_fee: float,
    channel_fee_rate_pct: float,
    share_ratio_pct: float,
) -> tuple[float, float, float]:
    """
    返回 (net_revenue, share_amount, settlement_amount)。
    share_amount 为分成毛额（可负）；settlement_amount = max(0, round(share,2)) 与 JS 一致。
    """
    try:
        disc = float(discount_rate)
    except (TypeError, ValueError):
        disc = 1.0
    if not math.isfinite(disc):
        disc = 1.0

    gf = float(revenue or 0)
    discounted_flow = gf * disc
    base = (
        discounted_flow
        - float(test_fee or 0)
        - float(coupon_amount or 0)
        - float(extra_fee or 0)
    )
    cf = float(channel_fee_rate_pct or 0) / 100.0
    sr = float(share_ratio_pct or 0) / 100.0
    raw = base * (1.0 - cf) * sr
    if not math.isfinite(raw):
        raw = 0.0
    share = round(raw, 2)
    settlement = max(0.0, share)
    net_rev = round(discounted_flow, 2)
    return net_rev, share, settlement
