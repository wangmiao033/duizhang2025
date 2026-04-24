"""研发对账明细行金额计算（与前端研发对账公式口径一致）。"""

from __future__ import annotations

from decimal import Decimal, InvalidOperation, ROUND_HALF_UP


def _to_decimal(value, fallback: str = "0") -> Decimal:
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return Decimal(fallback)


def _round2(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def compute_rd_line_amounts(
    revenue: float,
    discount_rate: float,
    test_fee: float,
    coupon_amount: float,
    extra_fee: float,
    channel_fee_rate_pct: float,
    share_ratio_pct: float,
    tax_rate_pct: float,
) -> tuple[float, float, float]:
    """
    返回 (net_revenue, share_amount, settlement_amount)。
    公式：
    总流水 = 后台流水 × 折扣
    计费基础 = 总流水 - 代金券 - 测试费 - 额外费用
    分成金额 = 计费基础 × (1 - 通道费%/100) × (1 - 税率%/100)
    结算金额 = 分成金额 × 分成%/100
    """
    disc = _to_decimal(discount_rate, "1")
    gf = _to_decimal(revenue, "0")
    discounted_flow = gf * disc
    base = (
        discounted_flow
        - _to_decimal(coupon_amount, "0")
        - _to_decimal(test_fee, "0")
        - _to_decimal(extra_fee, "0")
    )
    cf = _to_decimal(channel_fee_rate_pct, "0") / Decimal("100")
    tr = _to_decimal(tax_rate_pct, "0") / Decimal("100")
    sr = _to_decimal(share_ratio_pct, "0") / Decimal("100")
    share = base * (Decimal("1") - cf) * (Decimal("1") - tr)
    settlement = share * sr
    return float(_round2(discounted_flow)), float(_round2(share)), float(_round2(settlement))
