"""
Shop accounts — SQLite (intentional SQLi on login).

Normal CRUD uses bound parameters. authenticate() concatenates email/password
into SQL so DVWA-style login bypass and UNION dumps work.
"""
from __future__ import annotations

import hashlib
import os
import sqlite3
import threading
from pathlib import Path
from typing import Any

from audit_log import audit_event

_DATA_DIR = Path(os.getenv("USERS_DB_DIR", str(Path(__file__).parent / "data")))
_DB_PATH = Path(os.getenv("USERS_DB_PATH", str(_DATA_DIR / "users.db")))
_LOCK = threading.Lock()

# password_hash = sha256("jss-demo:" + plaintext)
_SEED_USERS: list[dict[str, str]] = [
    {
        "email": "sam.rivera@example.com",
        "name": "Sam Rivera",
        "role": "customer",
        "demo_password": "samwaves",
        "saved_shipping_address": "88 Pacific Coast Hwy, Laguna Beach, CA 92651",
    },
    {
        "email": "alex.morgan@example.com",
        "name": "Alex Morgan",
        "role": "customer",
        "demo_password": "alexwaves",
        "saved_shipping_address": "42 Ocean Drive, Huntington Beach, CA 92648",
    },
    {
        "email": "jordan.lee@example.com",
        "name": "Jordan Lee",
        "role": "customer",
        "demo_password": "jordanwaves",
        "saved_shipping_address": "15 Pier Ave, Hermosa Beach, CA 90254",
    },
    {
        "email": "admin@jayssurfshop.example",
        "name": "Jay Staff",
        "role": "admin",
        "demo_password": "staffadmin",
        "saved_shipping_address": "100 Main St, Huntington Beach, CA 92648",
    },
]


def hash_password(password: str) -> str:
    return hashlib.sha256(f"jss-demo:{password}".encode()).hexdigest()


def users_backend() -> str:
    return os.getenv("USERS_BACKEND", "sqlite")


def _connect() -> sqlite3.Connection:
    _DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(_DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _ensure_db() -> None:
    with _LOCK:
        conn = _connect()
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    email TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    role TEXT NOT NULL,
                    password_hash TEXT NOT NULL,
                    demo_password TEXT NOT NULL,
                    saved_shipping_address TEXT DEFAULT ''
                )
                """
            )
            count = conn.execute("SELECT COUNT(*) AS c FROM users").fetchone()["c"]
            if count == 0:
                for u in _SEED_USERS:
                    conn.execute(
                        """
                        INSERT INTO users
                          (email, name, role, password_hash, demo_password, saved_shipping_address)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """,
                        (
                            u["email"],
                            u["name"],
                            u["role"],
                            hash_password(u["demo_password"]),
                            u["demo_password"],
                            u["saved_shipping_address"],
                        ),
                    )
            conn.commit()
        finally:
            conn.close()


_ensure_db()


def _public_user(row: dict[str, Any] | sqlite3.Row) -> dict[str, str]:
    data = dict(row)
    out = {
        "email": str(data.get("email", "")),
        "name": str(data.get("name", "")),
        "role": str(data.get("role", "customer")),
    }
    if data.get("saved_shipping_address"):
        out["saved_shipping_address"] = str(data["saved_shipping_address"])
    return out


def _workshop_user(row: dict[str, Any] | sqlite3.Row) -> dict[str, str]:
    out = _public_user(row)
    data = dict(row)
    if data.get("demo_password"):
        out["demo_password"] = str(data["demo_password"])
    return out


def get_saved_shipping_address(email: str) -> dict[str, Any]:
    email = email.strip().lower()
    if not email:
        return {"found": False, "error": "Email required"}
    row = get_user(email)
    if not row:
        return {"found": False, "email": email, "error": "Account not found"}
    address = row.get("saved_shipping_address", "")
    if not address:
        return {"found": False, "email": email, "error": "No saved address on file"}
    audit_event("saved_address_lookup", email=email)
    return {
        "found": True,
        "email": email,
        "name": row.get("name", ""),
        "saved_shipping_address": address,
    }


def get_user(email: str) -> dict[str, Any] | None:
    """Safe lookup (parameterized)."""
    email = email.strip().lower()
    conn = _connect()
    try:
        row = conn.execute(
            "SELECT * FROM users WHERE email = ?",
            (email,),
        ).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def authenticate(email: str, password: str) -> tuple[dict[str, str] | None, dict[str, Any]]:
    """
    Intentionally vulnerable login (A03 / API2 SQLi).

    Payload examples (email field):
      ' OR 1=1--
      ' UNION SELECT email,name,role,demo_password,saved_shipping_address FROM users--
    """
    pwd_hash = hash_password(password)
    # Vulnerable: attacker-controlled strings inlined into SQL.
    sql = (
        "SELECT email, name, role, demo_password, saved_shipping_address "
        f"FROM users WHERE email = '{email}' AND password_hash = '{pwd_hash}'"
    )
    debug: dict[str, Any] = {
        "backend": "sqlite",
        "db_path": str(_DB_PATH),
        "sql": sql,
        "vulnerable": True,
    }

    conn = _connect()
    try:
        try:
            rows = [dict(r) for r in conn.execute(sql).fetchall()]
        except sqlite3.Error as exc:
            audit_event("auth_sqli_error", email=email[:80], error=str(exc))
            debug["error"] = str(exc)
            return None, debug

        debug["row_count"] = len(rows)
        debug["rows"] = [
            {
                "email": r.get("email"),
                "name": r.get("name"),
                "role": r.get("role"),
                "demo_password": r.get("demo_password"),
            }
            for r in rows
        ]

        if not rows:
            audit_event("auth_login_failed", email=email.strip().lower()[:120], reason="no_match")
            return None, debug

        # First row becomes the session identity (classic SQLi login bypass).
        user = _public_user(rows[0])
        audit_event(
            "auth_login",
            email=user["email"],
            role=user.get("role", "customer"),
            sqli_row_count=len(rows),
        )
        return user, debug
    finally:
        conn.close()


def list_users(*, include_demo_passwords: bool = False) -> list[dict[str, str]]:
    conn = _connect()
    try:
        rows = conn.execute("SELECT * FROM users ORDER BY email").fetchall()
        mapper = _workshop_user if include_demo_passwords else _public_user
        return [mapper(r) for r in rows]
    finally:
        conn.close()


def list_demo_accounts() -> list[dict[str, str]]:
    return list_users(include_demo_passwords=True)


def create_user(email: str, name: str, password: str, role: str = "customer") -> dict[str, Any]:
    email = email.strip().lower()
    role = role if role in ("customer", "admin") else "customer"
    if get_user(email):
        return {"created": False, "error": "User already exists"}

    conn = _connect()
    try:
        conn.execute(
            """
            INSERT INTO users
              (email, name, role, password_hash, demo_password, saved_shipping_address)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (email, name.strip(), role, hash_password(password), password, ""),
        )
        conn.commit()
    finally:
        conn.close()

    audit_event("user_created", email=email, role=role)
    return {
        "created": True,
        "user": _public_user(
            {
                "email": email,
                "name": name.strip(),
                "role": role,
            }
        ),
    }
