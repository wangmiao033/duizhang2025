"""银行流水台账附件本地存储（付款确认回单等，与 reconciliation bank-payment 附件分离）。"""

from __future__ import annotations

import os
from pathlib import Path

_BACKEND_ROOT = Path(__file__).resolve().parent.parent
_DEFAULT_DIR = _BACKEND_ROOT / "var" / "bank_transaction_attachments"


def bank_transaction_upload_root() -> Path:
    raw = os.environ.get("BANK_TRANSACTION_UPLOAD_DIR", "").strip()
    if raw:
        return Path(raw).expanduser().resolve()
    return _DEFAULT_DIR.resolve()


def ensure_bank_transaction_upload_root() -> Path:
    root = bank_transaction_upload_root()
    root.mkdir(parents=True, exist_ok=True)
    return root
