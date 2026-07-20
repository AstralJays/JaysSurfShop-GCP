import json
import os
import subprocess
import uuid
import random
import string
from datetime import datetime, timezone
from pathlib import Path

try:
    import importlib.metadata

    PYYAML_VERSION = importlib.metadata.version("pyyaml")
except Exception:
    PYYAML_VERSION = None

EICAR = r"X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"
EICAR_PATH = Path("/tmp/eicar.com")
SHELL_MARKER = Path("/tmp/jss-cloudrun-shell.txt")


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
            "runtime": "cloud-run",
            "gcp_runtime": bool(os.getenv("K_SERVICE") or os.getenv("FUNCTION_TARGET")),
            "pyyaml_version": PYYAML_VERSION,
            "routes": [
                "POST /checkout",
                "POST /fulfillment/carrier-check",
                "POST /fulfillment/av-sample",
                "GET /status",
            ],
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
        "runtime": "cloud-run",
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


def handle_carrier_check() -> tuple:
    """
    Shop feature: verify carrier CLI tooling on the fulfillment worker.
    Intentionally runs shell with pipe redirect — Cloud Run tracer Process signal.
    """
    cmd = f"id 2>&1 | tee {SHELL_MARKER}"
    proc = subprocess.run(["sh", "-c", cmd], capture_output=True, text=True, timeout=10)
    return _response(
        200,
        {
            "ok": True,
            "feature": "carrier_runtime_check",
            "runtime": "cloud-run",
            "command": cmd,
            "returncode": proc.returncode,
            "stdout": (proc.stdout or "").strip(),
            "marker_file": str(SHELL_MARKER),
            "marker_written": SHELL_MARKER.exists(),
            "look_for": "Shell Process Redirect · Process events on order-webhook (Cloud Run)",
        },
    )


def handle_av_sample() -> tuple:
    """
    Shop feature: attach AV test sample to a fulfillment package.
    Writes EICAR inside the Cloud Run container — File / malware signal.
    """
    EICAR_PATH.write_text(EICAR, encoding="utf-8")
    cat = subprocess.run(
        ["cat", str(EICAR_PATH)],
        capture_output=True,
        text=True,
        timeout=5,
    )
    return _response(
        200,
        {
            "ok": True,
            "feature": "fulfillment_av_sample",
            "runtime": "cloud-run",
            "path": str(EICAR_PATH),
            "written": EICAR_PATH.exists(),
            "length": len(EICAR),
            "cat_returncode": cat.returncode,
            "look_for": "Malware protection · File events on order-webhook (Cloud Run)",
        },
    )


def _normalize(path: str) -> str:
    normalized = path.split("?", 1)[0].rstrip("/") or "/"
    for suffix in (
        "/checkout",
        "/status",
        "/fulfillment/carrier-check",
        "/fulfillment/av-sample",
    ):
        if normalized.endswith(suffix):
            return suffix
    return normalized


def dispatch(method: str, path: str, body: dict) -> tuple:
    normalized = _normalize(path)
    method = method.upper()
    if normalized == "/status" and method == "GET":
        return handle_status()
    if normalized == "/checkout" and method == "POST":
        return handle_checkout(body)
    if normalized == "/fulfillment/carrier-check" and method == "POST":
        return handle_carrier_check()
    if normalized == "/fulfillment/av-sample" and method == "POST":
        return handle_av_sample()
    return _response(404, {"error": "not_found", "path": normalized, "method": method})


import functions_framework


@functions_framework.http
def order_webhook(request):
    body = _parse_body(request.get_data(as_text=True) if request.get_data() else "")
    return dispatch(request.method, request.path, body)
