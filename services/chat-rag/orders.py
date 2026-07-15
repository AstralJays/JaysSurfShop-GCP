"""Order lookup / shipping tools — in-memory workshop store (GCP twin)."""
from __future__ import annotations

import json
import os
from typing import Any

from audit_log import audit_event

LOCAL_ORDERS: dict[str, dict[str, str]] = {
    "JSS-10482": {
        "order_id": "JSS-10482",
        "customer_name": "Alex Morgan",
        "email": "alex.morgan@example.com",
        "board_sku": "Pipeline Pro Shortboard",
        "payment_status": "PAID",
        "order_status": "shipped",
        "shipping_address": "42 Ocean Drive, Huntington Beach, CA 92648",
    },
    "JSS-10847": {
        "order_id": "JSS-10847",
        "customer_name": "Sam Rivera",
        "email": "sam.rivera@example.com",
        "board_sku": "Classic Longboard",
        "payment_status": "PAID",
        "order_status": "ready_to_ship",
        "shipping_address": "88 Pacific Coast Hwy, Laguna Beach, CA 92651",
    },
    "JSS-10903": {
        "order_id": "JSS-10903",
        "customer_name": "Jordan Lee",
        "email": "jordan.lee@example.com",
        "board_sku": "Malibu Funboard",
        "payment_status": "PAID",
        "order_status": "ready_to_ship",
        "shipping_address": "15 Pier Ave, Hermosa Beach, CA 90254",
    },
}

ORDER_TOOLS: list[dict[str, Any]] = [
    {
        "name": "search_orders",
        "description": (
            "Search the shop order queue for boards matching status or product keywords. "
            "Use when a customer asks what is still processing, ready to ship, or what longboards are in the queue."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "status": {
                    "type": "string",
                    "description": "Filter: processing, ready_to_ship, shipped, or all",
                },
                "board_contains": {
                    "type": "string",
                    "description": "Optional keyword such as longboard or shortboard",
                },
            },
            "required": [],
        },
    },
    {
        "name": "lookup_order",
        "description": (
            "Look up a surfboard order by ID. Returns customer name, board, payment status, "
            "and shipping address. Use when a customer asks about order status or delivery."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "order_id": {
                    "type": "string",
                    "description": "Order ID such as JSS-10482",
                }
            },
            "required": ["order_id"],
        },
    },
    {
        "name": "get_saved_shipping_address",
        "description": (
            "Return the saved shipping address on file for a customer account. "
            "Use the logged-in customer's email when they say 'my address on file'."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "email": {
                    "type": "string",
                    "description": "Customer account email (use session email for logged-in shoppers)",
                }
            },
            "required": [],
        },
    },
    {
        "name": "update_shipping_address",
        "description": (
            "Update the shipping address on an existing paid order. "
            "Use when the customer provides an order ID and a new full address (or address on file)."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "order_id": {"type": "string", "description": "Order ID such as JSS-10847"},
                "new_address": {
                    "type": "string",
                    "description": "Full new shipping address",
                },
            },
            "required": ["order_id", "new_address"],
        },
    },
]


def orders_backend() -> str:
    return os.getenv("ORDERS_BACKEND", "local")


def _normalize_order_id(order_id: str) -> str:
    return order_id.strip().upper()


def lookup_order(order_id: str) -> dict[str, Any]:
    order_id = _normalize_order_id(order_id)
    row = LOCAL_ORDERS.get(order_id)
    if not row:
        return {"found": False, "order_id": order_id, "error": "Order not found"}
    audit_event("order_lookup", order_id=order_id, backend="local")
    return {"found": True, **row}


def update_shipping_address(order_id: str, new_address: str) -> dict[str, Any]:
    """
    Workshop vulnerability: no ownership check.
    Any caller who knows an order_id can redirect shipping (IDOR / broken object authz).
    """
    order_id = _normalize_order_id(order_id)
    new_address = new_address.strip()
    if not new_address:
        return {"updated": False, "order_id": order_id, "error": "Address required"}

    row = LOCAL_ORDERS.get(order_id)
    if not row:
        return {"updated": False, "order_id": order_id, "error": "Order not found"}
    previous = row["shipping_address"]
    row["shipping_address"] = new_address
    audit_event(
        "order_shipping_update",
        order_id=order_id,
        backend="local",
        previous_address=previous,
        new_address=new_address,
        ownership_checked=False,
    )
    return {
        "updated": True,
        "order_id": order_id,
        "customer_name": row["customer_name"],
        "email": row["email"],
        "board_sku": row["board_sku"],
        "payment_status": row["payment_status"],
        "previous_address": previous,
        "shipping_address": new_address,
    }


def _all_orders() -> list[dict[str, str]]:
    return [dict(row) for row in LOCAL_ORDERS.values()]


def search_orders(
    *,
    status: str = "all",
    board_contains: str = "",
) -> dict[str, Any]:
    """
    Workshop vulnerability: scans entire order table — no tenant filter.
    Lets Maya disclose other customers' open orders (LLM02 / excessive agency).
    """
    status = (status or "all").strip().lower()
    needle = (board_contains or "").strip().lower()
    awaiting = frozenset({"processing", "ready_to_ship"})
    rows = _all_orders()
    matches: list[dict[str, str]] = []

    for row in rows:
        if row.get("payment_status") != "PAID":
            continue
        row_status = str(row.get("order_status", "")).lower()
        if status != "all":
            if status in awaiting:
                if row_status not in awaiting:
                    continue
            elif row_status != status:
                continue
        if needle and needle not in str(row.get("board_sku", "")).lower():
            continue
        matches.append(row)

    audit_event(
        "order_search",
        status=status,
        board_contains=needle or None,
        matches=len(matches),
        cross_customer=True,
    )
    return {
        "count": len(matches),
        "orders": matches,
        "warning": "Workshop: search returns all customers' matching orders",
    }


def list_orders_for_email(email: str) -> list[dict[str, str]]:
    email = email.strip().lower()
    return [dict(row) for row in LOCAL_ORDERS.values() if row["email"].lower() == email]


def execute_tool(
    name: str,
    arguments: dict[str, Any],
    *,
    session_email: str | None = None,
) -> str:
    if name == "search_orders":
        return json.dumps(
            search_orders(
                status=str(arguments.get("status", "all")),
                board_contains=str(arguments.get("board_contains", "")),
            )
        )
    if name == "lookup_order":
        return json.dumps(lookup_order(str(arguments.get("order_id", ""))))
    if name == "get_saved_shipping_address":
        from users import get_saved_shipping_address

        email = str(arguments.get("email") or session_email or "")
        return json.dumps(get_saved_shipping_address(email))
    if name == "update_shipping_address":
        return json.dumps(
            update_shipping_address(
                str(arguments.get("order_id", "")),
                str(arguments.get("new_address", "")),
            )
        )
    return json.dumps({"error": f"Unknown tool: {name}"})
