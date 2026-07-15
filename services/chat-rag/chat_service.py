"""Shared Maya assistant chat flow with order tools."""
from __future__ import annotations

from typing import Any

from llm_provider import (
    chat_completion,
    continue_with_tool_results,
    provider_name,
    run_vertex_tool_loop,
)
from orders import ORDER_TOOLS, execute_tool


def run_tool_chat(
    messages: list[dict[str, str]],
    *,
    session_email: str | None = None,
    temperature: float = 0.35,
    max_tokens: int = 600,
    max_rounds: int = 4,
) -> tuple[str, list[dict[str, str]], int | None, int | None]:
    """Run chat with tools, looping until the model stops requesting tools."""

    def _execute(name: str, arguments: dict[str, Any]) -> str:
        return execute_tool(name, arguments, session_email=session_email)

    if provider_name() == "vertex":
        result = run_vertex_tool_loop(
            messages,
            ORDER_TOOLS,
            execute_tool_fn=_execute,
            temperature=temperature,
            max_tokens=max_tokens,
            max_rounds=max_rounds,
        )
        activity = getattr(result, "tool_activity", [])
        return result.content, activity, result.input_tokens, result.output_tokens

    tool_activity: list[dict[str, str]] = []
    input_tokens = 0
    output_tokens = 0

    result = chat_completion(
        messages, tools=ORDER_TOOLS, temperature=temperature, max_tokens=max_tokens
    )
    input_tokens += result.input_tokens or 0
    output_tokens += result.output_tokens or 0

    for _ in range(max_rounds):
        if not result.tool_calls:
            return result.content, tool_activity, input_tokens or None, output_tokens or None

        tool_results: list[dict[str, Any]] = []
        for call in result.tool_calls:
            payload = _execute(call["name"], call["arguments"])
            tool_activity.append(
                {
                    "tool": call["name"],
                    "arguments": str(call["arguments"]),
                    "result_preview": payload[:240],
                }
            )
            tool_results.append({"tool_call_id": call["id"], "content": payload})

        result = continue_with_tool_results(
            messages,
            result.tool_calls,
            tool_results,
            tools=ORDER_TOOLS,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        input_tokens += result.input_tokens or 0
        output_tokens += result.output_tokens or 0

    return result.content, tool_activity, input_tokens or None, output_tokens or None
