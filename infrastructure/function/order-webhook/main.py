import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
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
EICAR_FILE_PATH = "/tmp/eicar.com"
CLOUDRUN_SHELL_MARKER = "/tmp/jss-cloudrun-shell.txt"


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
                    "note": "Unsafe yaml.load() on fulfillmentManifest in POST /checkout and /demo/yaml",
                }
            ],
            "routes": [
                "POST /checkout (fulfillmentManifest YAML chain)",
                "GET /status",
                "GET /demo/eicar",
                "POST /demo/eicar-file",
                "POST /demo/shell-pipe",
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
    from workshop_chain import poisoned_manifest, run_checkout_chain

    items = body.get("items") or []
    subtotal = body.get("subtotal", 0)
    response_body = {
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
    }

    manifest = poisoned_manifest(body)
    if manifest:
        response_body["securityDemo"] = run_checkout_chain(manifest)
        response_body["fulfillment"]["manifestParsed"] = True

    return _response(200, response_body)


def handle_eicar() -> tuple:
    return _response(
        200,
        {
            "demo": "eicar",
            "purpose": "malware_scanner_test",
            "warning": "Harmless EICAR test string",
            "payload": EICAR,
            "runtime_file_demo": "POST /demo/eicar-file writes to /tmp/eicar.com for tracer File events",
        },
    )


def handle_eicar_file() -> tuple:
    """Write EICAR to container filesystem — malware / custom File rule signal."""
    target = Path(EICAR_FILE_PATH)
    target.write_text(EICAR, encoding="utf-8")
    return _response(
        200,
        {
            "exploited": target.exists(),
            "pattern": "eicar_file_write",
            "path": str(target),
            "length": len(EICAR),
            "scope": "cloud-run-runtime",
            "narrative": "EICAR written inside Cloud Run container — File / malware protection signal.",
            "upwind_policies": ["Malware protection", "Custom File rules"],
        },
    )


def handle_shell_pipe() -> tuple:
    """Shell with pipe redirect — Process policy signal for Upwind tracer on Cloud Run."""
    out = Path(CLOUDRUN_SHELL_MARKER)
    cmd = f"id 2>&1 | tee {out}"
    proc = subprocess.run(["sh", "-c", cmd], capture_output=True, text=True, timeout=10)
    return _response(
        200,
        {
            "exploited": proc.returncode == 0,
            "pattern": "shell_pipe_redirect",
            "command": cmd,
            "stdout": proc.stdout.strip(),
            "marker_file": str(out),
            "marker_written": out.exists(),
            "scope": "cloud-run-runtime",
            "narrative": "Shell spawned with pipe redirect in order-webhook — post-exploit pattern for tracer Process events.",
            "upwind_policies": ["Shell Process Redirect", "Custom Process rules"],
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
    # Cloud Functions Gen2 / Cloud Run may include the service path prefix
    normalized = path.split("?", 1)[0].rstrip("/") or "/"
    if normalized.endswith("/demo/eicar"):
        normalized = "/demo/eicar"
    elif normalized.endswith("/demo/eicar-file"):
        normalized = "/demo/eicar-file"
    elif normalized.endswith("/demo/shell-pipe"):
        normalized = "/demo/shell-pipe"
    elif normalized.endswith("/demo/yaml"):
        normalized = "/demo/yaml"
    elif normalized.endswith("/checkout"):
        normalized = "/checkout"
    elif normalized.endswith("/status"):
        normalized = "/status"
    if normalized == "/status" and method.upper() == "GET":
        return handle_status()
    if normalized == "/checkout" and method.upper() == "POST":
        return handle_checkout(body)
    if normalized == "/demo/eicar" and method.upper() == "GET":
        return handle_eicar()
    if normalized == "/demo/eicar-file" and method.upper() == "POST":
        return handle_eicar_file()
    if normalized == "/demo/shell-pipe" and method.upper() == "POST":
        return handle_shell_pipe()
    if normalized == "/demo/yaml" and method.upper() == "POST":
        return handle_yaml(body)
    return _response(404, {"error": "not_found", "path": normalized, "method": method})


import functions_framework


@functions_framework.http
def order_webhook(request):
    body = _parse_body(request.get_data(as_text=True) if request.get_data() else "")
    return dispatch(request.method, request.path, body)
