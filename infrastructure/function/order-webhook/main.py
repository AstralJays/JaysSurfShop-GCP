import json
import os
from datetime import datetime, timezone
import uuid
import random
import string

try:
    import importlib.metadata

    PYYAML_VERSION = importlib.metadata.version("pyyaml")
except Exception:
    PYYAML_VERSION = None

EICAR = r"X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"
DEFAULT_YAML_PAYLOAD = "!!python/object/apply:builtins.eval\nargs: ['\"exploited\"']"


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
            "eicar_present": True,
            "eicar_length": len(EICAR),
            "pyyaml_version": PYYAML_VERSION,
            "vulnerable_packages": [
                {
                    "cve": "CVE-2020-14343",
                    "package": f"pyyaml {PYYAML_VERSION or 'unknown'}",
                    "service": "order-webhook",
                    "note": "Unsafe yaml.load() enabled on /demo/yaml",
                }
            ],
            "routes": [
                "POST /checkout",
                "GET /status",
                "GET /demo/eicar",
                "POST /demo/yaml",
            ],
            "api_gateway": {
                "public": True,
                "authenticated": False,
                "authorization_type": "NONE",
                "api_key_required": False,
                "cors_allow_origins": "*",
            },
        },
    )


def handle_checkout(body: dict) -> tuple:
    items = body.get("items") or []
    subtotal = body.get("subtotal", 0)
    return _response(
        200,
        {
            "orderId": _order_id(),
            "status": "pending",
            "receivedAt": datetime.now(timezone.utc).isoformat(),
            "itemCount": sum(int(i.get("quantity", 1)) for i in items),
            "subtotal": subtotal,
            "message": "Order queued for fulfillment (demo webhook)",
            "fulfillment": {
                "handler": "order-webhook-function",
                "traceId": str(uuid.uuid4()),
            },
        },
    )


def handle_eicar() -> tuple:
    return _response(
        200,
        {
            "demo": "eicar",
            "purpose": "malware_scanner_test",
            "warning": "Harmless EICAR test string",
            "payload": EICAR,
        },
    )


def handle_yaml(body: dict) -> tuple:
    import yaml

    payload = body.get("payload") or DEFAULT_YAML_PAYLOAD
    try:
        result = yaml.load(payload, Loader=yaml.Loader)
        exploited = result == "exploited" or result is not None
    except Exception as exc:
        return _response(
            500,
            {
                "exploited": False,
                "cve": "CVE-2020-14343",
                "package": f"pyyaml {PYYAML_VERSION}",
                "error": str(exc),
            },
        )

    return _response(
        200,
        {
            "exploited": exploited,
            "cve": "CVE-2020-14343",
            "package": f"pyyaml {PYYAML_VERSION}",
            "pattern": "unsafe_deserialization",
            "scope": "function-runtime",
            "result": str(result),
        },
    )


def dispatch(method: str, path: str, body: dict) -> tuple:
    normalized = path.rstrip("/") or "/"
    if normalized == "/status" and method.upper() == "GET":
        return handle_status()
    if normalized == "/checkout" and method.upper() == "POST":
        return handle_checkout(body)
    if normalized == "/demo/eicar" and method.upper() == "GET":
        return handle_eicar()
    if normalized == "/demo/yaml" and method.upper() == "POST":
        return handle_yaml(body)
    return _response(404, {"error": "not_found", "path": normalized, "method": method})


import functions_framework


@functions_framework.http
def order_webhook(request):
    body = _parse_body(request.get_data(as_text=True) if request.get_data() else "")
    return dispatch(request.method, request.path, body)
