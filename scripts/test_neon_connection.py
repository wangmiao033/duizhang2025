#!/usr/bin/env python3
"""Minimal Neon/PostgreSQL connectivity check. Reads DATABASE_URL from the environment."""

from __future__ import annotations

import os
import sys

try:
    import psycopg
except ImportError:
    print(
        'Missing dependency: install with  pip install "psycopg[binary]"',
        file=sys.stderr,
    )
    sys.exit(1)


def main() -> None:
    url = os.environ.get("DATABASE_URL")
    if not url or not str(url).strip():
        print(
            "DATABASE_URL is not set or is empty.",
            file=sys.stderr,
        )
        sys.exit(1)

    try:
        with psycopg.connect(url.strip()) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()
    except Exception as e:
        print(f"Connection failed: {e}", file=sys.stderr)
        sys.exit(1)

    print("Neon connection ok")


if __name__ == "__main__":
    main()
