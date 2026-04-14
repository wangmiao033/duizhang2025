#!/usr/bin/env python3
"""
将 reconciliation_records 中 statement_no 含 NaN 的脏数据回填为 JS-YYYYMMDD-###。

依据：优先 settlement_month（YYYY-MM 或 YYYY-MM-DD），否则用 created_at 的 UTC 日期。
序号：在同一 YYYYMMDD 前缀下，取当前「可用编号集合」中最大三位序号 +1（可用集合 = 全表编号去掉待替换的脏号，并含本脚本已分配的新号）。

用法（在 backend 目录）：
  pip install -r requirements.txt
  配置 .env 中 DATABASE_URL
  python scripts/fix_corrupt_statement_no.py

仅更新 statement_no 匹配 NaN 的行；执行前请自行备份数据库。
"""

from __future__ import annotations

import os
import re
from datetime import datetime, timezone

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

_MONTH = re.compile(r"^(\d{4})-(\d{2})(?:-(\d{2}))?$")


def _parse_month(s: str | None) -> datetime | None:
    if not s or not isinstance(s, str):
        return None
    s = s.strip()
    m = _MONTH.match(s)
    if not m:
        return None
    y, mo = int(m[1]), int(m[2])
    if not (1 <= mo <= 12):
        return None
    if m.group(3):
        d = int(m.group(3))
        try:
            return datetime(y, mo, d, tzinfo=timezone.utc)
        except ValueError:
            return None
    return datetime(y, mo, 1, tzinfo=timezone.utc)


def _ref_dt(row) -> datetime:
    d = _parse_month(row["settlement_month"])
    if d is not None:
        return d
    ca = row["created_at"]
    if ca is None:
        return datetime.now(timezone.utc)
    if getattr(ca, "tzinfo", None) is None:
        return ca.replace(tzinfo=timezone.utc)
    return ca.astimezone(timezone.utc)


def _yyyymmdd(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y%m%d")


def main() -> None:
    load_dotenv()
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise SystemExit("缺少环境变量 DATABASE_URL")

    engine = create_engine(url)
    with engine.connect() as conn:
        corrupt = conn.execute(
            text(
                "SELECT id, statement_no, settlement_month, created_at "
                "FROM reconciliation_records WHERE statement_no ~* 'NaN'"
            )
        ).mappings().all()
        all_rows = conn.execute(text("SELECT statement_no FROM reconciliation_records")).all()
        all_nos = {str(r[0]) for r in all_rows}

    if not corrupt:
        print("无含 NaN 的 statement_no，跳过。")
        return

    to_replace = {str(row["statement_no"]) for row in corrupt}
    pool = set(all_nos) - to_replace
    updates: list[tuple[str, str]] = []

    for row in corrupt:
        rid = str(row["id"])
        prefix = f"JS-{_yyyymmdd(_ref_dt(row))}-"
        pat = re.compile(re.escape(prefix) + r"(\d{3})$")
        max_seq = 0
        for no in pool:
            m = pat.match(no)
            if m:
                max_seq = max(max_seq, int(m.group(1)))
        new_no = f"{prefix}{max_seq + 1:03d}"
        pool.add(new_no)
        updates.append((new_no, rid))

    with engine.begin() as conn:
        for new_no, rid in updates:
            conn.execute(
                text("UPDATE reconciliation_records SET statement_no = :no WHERE id = :id"),
                {"no": new_no, "id": rid},
            )

    print(f"已更新 {len(updates)} 条记录。")


if __name__ == "__main__":
    main()
