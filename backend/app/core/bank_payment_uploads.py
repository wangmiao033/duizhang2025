"""付款流水单附件本地存储路径（不上云；部署时需持久卷或定期备份 var目录）。"""

from __future__ import annotations

import os
from pathlib import Path

# 相对 backend 应用根目录（含 app/ 的上一级）
_BACKEND_ROOT = Path(__file__).resolve().parent.parent
_DEFAULT_DIR = _BACKEND_ROOT / "var" / "bank_payment_attachments"


def bank_payment_upload_root() -> Path:
    raw = os.environ.get("BANK_PAYMENT_UPLOAD_DIR", "").strip()
    if raw:
        return Path(raw).expanduser().resolve()
    return _DEFAULT_DIR.resolve()


def ensure_upload_root() -> Path:
    root = bank_payment_upload_root()
    root.mkdir(parents=True, exist_ok=True)
    return root
