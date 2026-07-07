"""Structured audit logging for AI SPM and Cloud XDR ingestion."""

import json
import logging
import os
from datetime import datetime, timezone
from typing import Any

SERVICE_NAME = os.getenv("SERVICE_NAME", "unknown")
ENVIRONMENT = os.getenv("ENVIRONMENT", "local")


def _configure_logger() -> logging.Logger:
    logger = logging.getLogger("audit")
    if logger.handlers:
        return logger

    handler = logging.StreamHandler()
    if os.getenv("LOG_FORMAT", "json") == "json":
        handler.setFormatter(logging.Formatter("%(message)s"))
    else:
        handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))

    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    logger.propagate = False
    return logger


_audit_logger = _configure_logger()


def audit_event(event_type: str, **fields: Any) -> None:
    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": event_type,
        "service": SERVICE_NAME,
        "environment": ENVIRONMENT,
        "deployment_id": os.getenv("DEPLOYMENT_ID", "local"),
        **fields,
    }
    _audit_logger.info(json.dumps(record, default=str))


def audit_ai_inference(
    *,
    model: str,
    operation: str,
    input_tokens: int | None = None,
    output_tokens: int | None = None,
    latency_ms: int | None = None,
    user_prompt_hash: str | None = None,
    success: bool = True,
    error: str | None = None,
) -> None:
    audit_event(
        "ai_inference",
        model=model,
        operation=operation,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        latency_ms=latency_ms,
        user_prompt_hash=user_prompt_hash,
        success=success,
        error=error,
        ai_provider="openai",
    )
