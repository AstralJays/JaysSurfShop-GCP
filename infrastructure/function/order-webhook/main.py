import json
import os
import uuid
import random
import string
from datetime import datetime, timezone

try:
    import importlib.metadata

    PYYAML_VERSION = importlib.metadata.version("pyyaml")
except Exception:
    PYYAML_VERSION = None


def _response(status: int, body: dict) -> tuple:
    return (
        json.dumps(body),
        status,
        {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
    )


def _parse_body(raw: str) -> dict:
    try:
        return json.loads(raw) if raw else {}
    except json.JSONDecodeError:
        return {}


def _order_id() -> str:
    suffix = "".join(random.choices(string.digits, k=4))
    return f"ORD-{suffix}"


def handle_status() -> tuple:
    return _response(
        200,
        {
            "service": "order-webhook",
            "status": "ok",
            "environment": os.getenv("ENVIRONMENT", "demo"),
            "gcp_runtime": bool(os.getenv("K_SERVICE") or os.getenv("FUNCTION_TARGET")),
            "pyyaml_version": PYYAML_VERSION,
            "routes": ["POST /checkout", "GET /status"],
        },
    )


def handle_checkout(body: dict) -> tuple:
    from workshop_chain import poisoned_manifest, run_checkout_chain

    items = body.get("items") or []
    subtotal = body.get("subtotal", 0)
    response_body = {
        "orderId": _order_id(),
        "status": "pending",
        "receivedAt": datetime.now(timezone.utc).isoformat(),
        "itemCount": sum(int(i.get("quantity", 1)) for i in items),
        "subtotal": subtotal,
        "message": "Order queued for fulfillment",
        "fulfillment": {
            "handler": "order-webhook-function",
            "traceId": str(uuid.uuid4()),
        },
    }

    manifest = poisoned_manifest(body)
    if manifest:
        response_body["securityDemo"] = run_checkout_chain(manifest)
        response_body["fulfillment"]["manifestParsed"] = True

    return _response(200, response_body)


def dispatch(method: str, path: str, body: dict) -> tuple:
    normalized = path.split("?", 1)[0].rstrip("/") or "/"
    if normalized.endswith("/checkout"):
        normalized = "/checkout"
    elif normalized.endswith("/status"):
        normalized = "/status"
    if normalized == "/status" and method.upper() == "GET":
        return handle_status()
    if normalized == "/checkout" and method.upper() == "POST":
        return handle_checkout(body)
    return _response(404, {"error": "not_found", "path": normalized, "method": method})


import functions_framework


@functions_framework.http
def order_webhook(request):
    body = _parse_body(request.get_data(as_text=True) if request.get_data() else "")
    return dispatch(request.method, request.path, body)
