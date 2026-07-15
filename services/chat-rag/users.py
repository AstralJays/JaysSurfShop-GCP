"""Customer / admin accounts — in-memory workshop store (GCP twin of AWS users.py)."""
from __future__ import annotations

import hashlib
import os
from typing import Any

from audit_log import audit_event

# password_hash = sha256("jss-demo:" + plaintext)
LOCAL_USERS: dict[str, dict[str, str]] = {
    "sam.rivera@example.com": {
        "email": "sam.rivera@example.com",
        "name": "Sam Rivera",
        "role": "customer",
        "password_hash": "977cf177eb8ce44532519d2766ebfd8263347e6c26c5da9effacc2979de3b75f",
        "demo_password": "samwaves",
        "saved_shipping_address": "88 Pacific Coast Hwy, Laguna Beach, CA 92651",
    },
    "alex.morgan@example.com": {
        "email": "alex.morgan@example.com",
        "name": "Alex Morgan",
        "role": "customer",
        "password_hash": "0ab05b62426e85c335bc485d0f3f49c43779c988dae56a3972bffa5080f21ba7",
        "demo_password": "alexwaves",
        "saved_shipping_address": "42 Ocean Drive, Huntington Beach, CA 92648",
    },
    "jordan.lee@example.com": {
        "email": "jordan.lee@example.com",
        "name": "Jordan Lee",
        "role": "customer",
        "password_hash": "429844ae698d7344d5adb77895f52fac265661e86d0823ad68a950152aeff99b",
        "demo_password": "jordanwaves",
        "saved_shipping_address": "15 Pier Ave, Hermosa Beach, CA 90254",
    },
    "admin@jayssurfshop.example": {
        "email": "admin@jayssurfshop.example",
        "name": "Jay Staff",
        "role": "admin",
        "password_hash": "dc4aede16df3fbc07a0808491a3176ff50caff11b58d9232a7b3b4cc73cea26a",
        "demo_password": "staffadmin",
        "saved_shipping_address": "100 Main St, Huntington Beach, CA 92648",
    },
}


def users_backend() -> str:
    return os.getenv("USERS_BACKEND", "local")


def hash_password(password: str) -> str:
    return hashlib.sha256(f"jss-demo:{password}".encode()).hexdigest()


def _public_user(row: dict[str, Any]) -> dict[str, str]:
    out = {
        "email": str(row.get("email", "")),
        "name": str(row.get("name", "")),
        "role": str(row.get("role", "customer")),
    }
    if row.get("saved_shipping_address"):
        out["saved_shipping_address"] = str(row["saved_shipping_address"])
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


def _workshop_user(row: dict[str, Any]) -> dict[str, str]:
    """Includes demo_password for login page / admin console (intentional workshop leak)."""
    out = _public_user(row)
    if row.get("demo_password"):
        out["demo_password"] = str(row["demo_password"])
    return out


def get_user(email: str) -> dict[str, Any] | None:
    email = email.strip().lower()
    return LOCAL_USERS.get(email)


def authenticate(email: str, password: str) -> dict[str, str] | None:
    row = get_user(email)
    if not row:
        audit_event("auth_login_failed", email=email.strip().lower(), reason="unknown_user")
        return None
    if row.get("password_hash") != hash_password(password):
        audit_event("auth_login_failed", email=email.strip().lower(), reason="bad_password")
        return None
    audit_event("auth_login", email=row["email"], role=row.get("role", "customer"))
    return _public_user(row)


def list_users(*, include_demo_passwords: bool = False) -> list[dict[str, str]]:
    rows = list(LOCAL_USERS.values())
    mapper = _workshop_user if include_demo_passwords else _public_user
    return sorted((mapper(r) for r in rows), key=lambda u: u["email"])


def list_demo_accounts() -> list[dict[str, str]]:
    """Public workshop account list for the login page (email + demo password)."""
    return list_users(include_demo_passwords=True)


def create_user(email: str, name: str, password: str, role: str = "customer") -> dict[str, Any]:
    email = email.strip().lower()
    role = role if role in ("customer", "admin") else "customer"
    if get_user(email):
        return {"created": False, "error": "User already exists"}

    row = {
        "email": email,
        "name": name.strip(),
        "role": role,
        "password_hash": hash_password(password),
        "demo_password": password,
    }
    LOCAL_USERS[email] = row
    audit_event("user_created", email=email, role=role)
    return {"created": True, "user": _public_user(row)}
