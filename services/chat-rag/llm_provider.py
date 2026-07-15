"""Cloud-native LLM providers for chat-rag (Vertex AI on GCP, OpenAI fallback)."""
from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any

from openai import OpenAI


@dataclass
class ChatResult:
    content: str
    tool_calls: list[dict[str, Any]]
    input_tokens: int | None = None
    output_tokens: int | None = None


def provider_name() -> str:
    return os.getenv("LLM_PROVIDER", "openai").strip().lower()


def is_configured() -> bool:
    name = provider_name()
    if name == "vertex":
        return bool(
            os.getenv("GOOGLE_CLOUD_PROJECT")
            or os.getenv("GCP_PROJECT")
            or os.getenv("VERTEX_PROJECT")
        )
    key = os.getenv("OPENAI_API_KEY", "")
    return bool(key) and not key.startswith("sk-your")


def chat_model() -> str:
    if provider_name() == "vertex":
        return os.getenv("AI_MODEL_CHAT", "gemini-2.5-flash")
    return os.getenv("AI_MODEL_CHAT", "gpt-4o-mini")


def embed_model() -> str:
    if provider_name() == "vertex":
        return os.getenv("AI_MODEL_EMBED", "text-embedding-004")
    return os.getenv("AI_MODEL_EMBED", "text-embedding-3-small")


def _project_id() -> str:
    return (
        os.getenv("VERTEX_PROJECT")
        or os.getenv("GOOGLE_CLOUD_PROJECT")
        or os.getenv("GCP_PROJECT")
        or ""
    )


def _location() -> str:
    return os.getenv("VERTEX_LOCATION") or os.getenv("GCP_REGION") or "us-central1"


def _openai_client() -> OpenAI:
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _vertex_client():
    from google import genai

    return genai.Client(vertexai=True, project=_project_id(), location=_location())


def _to_openai_tools(tools: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "type": "function",
            "function": {
                "name": tool["name"],
                "description": tool["description"],
                "parameters": tool["parameters"],
            },
        }
        for tool in tools
    ]


def _parse_openai_tool_calls(message: Any) -> list[dict[str, Any]]:
    calls: list[dict[str, Any]] = []
    for call in getattr(message, "tool_calls", None) or []:
        fn = call.function
        try:
            args = json.loads(fn.arguments or "{}")
        except json.JSONDecodeError:
            args = {}
        calls.append({"id": call.id, "name": fn.name, "arguments": args})
    return calls


def _split_system(messages: list[dict[str, str]]) -> tuple[str | None, list[dict[str, str]]]:
    system_parts: list[str] = []
    out: list[dict[str, str]] = []
    for msg in messages:
        if msg["role"] == "system":
            system_parts.append(msg["content"])
            continue
        out.append({"role": msg["role"], "content": msg["content"]})
    system = "\n\n".join(system_parts) if system_parts else None
    return system, out


def _vertex_contents(messages: list[dict[str, str]]) -> list[Any]:
    from google.genai import types

    contents: list[Any] = []
    for msg in messages:
        role = "user" if msg["role"] == "user" else "model"
        contents.append(
            types.Content(role=role, parts=[types.Part.from_text(text=msg["content"])])
        )
    return contents


def chat_completion(
    messages: list[dict[str, str]],
    *,
    tools: list[dict[str, Any]] | None = None,
    temperature: float = 0.4,
    max_tokens: int = 500,
) -> ChatResult:
    if not is_configured():
        raise RuntimeError("LLM provider not configured")

    if provider_name() == "vertex":
        return _vertex_chat(messages, tools=tools, temperature=temperature, max_tokens=max_tokens)
    return _openai_chat(messages, tools=tools, temperature=temperature, max_tokens=max_tokens)


def _openai_chat(
    messages: list[dict[str, Any]],
    *,
    tools: list[dict[str, Any]] | None,
    temperature: float,
    max_tokens: int,
) -> ChatResult:
    kwargs: dict[str, Any] = {
        "model": chat_model(),
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if tools:
        kwargs["tools"] = _to_openai_tools(tools)
        kwargs["tool_choice"] = "auto"

    response = _openai_client().chat.completions.create(**kwargs)
    message = response.choices[0].message
    usage = response.usage
    return ChatResult(
        content=message.content or "",
        tool_calls=_parse_openai_tool_calls(message),
        input_tokens=usage.prompt_tokens if usage else None,
        output_tokens=usage.completion_tokens if usage else None,
    )


def _vertex_tool_config(tools: list[dict[str, Any]] | None) -> list[Any] | None:
    if not tools:
        return None
    from google.genai import types

    decls = [
        types.FunctionDeclaration(
            name=tool["name"],
            description=tool["description"],
            parameters=tool["parameters"],
        )
        for tool in tools
    ]
    return [types.Tool(function_declarations=decls)]


def _parse_vertex_response(response: Any) -> tuple[str, list[dict[str, Any]], Any | None]:
    """Return text, tool_calls, and the model Content (for multi-turn tool loops)."""
    text_parts: list[str] = []
    tool_calls: list[dict[str, Any]] = []
    model_content = None

    candidates = getattr(response, "candidates", None) or []
    if candidates:
        model_content = getattr(candidates[0], "content", None)
        for part in getattr(model_content, "parts", None) or []:
            if getattr(part, "text", None):
                text_parts.append(part.text)
            fn = getattr(part, "function_call", None)
            if fn:
                args = dict(getattr(fn, "args", None) or {})
                name = getattr(fn, "name", "") or ""
                tool_calls.append(
                    {
                        "id": f"{name}-{len(tool_calls)}",
                        "name": name,
                        "arguments": args,
                    }
                )

    if not text_parts and hasattr(response, "text") and response.text:
        text_parts.append(response.text)

    return "\n".join(text_parts).strip(), tool_calls, model_content


def _vertex_chat(
    messages: list[dict[str, str]],
    *,
    tools: list[dict[str, Any]] | None,
    temperature: float,
    max_tokens: int,
) -> ChatResult:
    from google.genai import types

    system, turns = _split_system(messages)
    config_kwargs: dict[str, Any] = {
        "temperature": temperature,
        "max_output_tokens": max_tokens,
    }
    if system:
        config_kwargs["system_instruction"] = system
    tool_cfg = _vertex_tool_config(tools)
    if tool_cfg:
        config_kwargs["tools"] = tool_cfg

    response = _vertex_client().models.generate_content(
        model=chat_model(),
        contents=_vertex_contents(turns),
        config=types.GenerateContentConfig(**config_kwargs),
    )

    text, tool_calls, _ = _parse_vertex_response(response)
    usage = getattr(response, "usage_metadata", None)
    return ChatResult(
        content=text,
        tool_calls=tool_calls,
        input_tokens=getattr(usage, "prompt_token_count", None) if usage else None,
        output_tokens=getattr(usage, "candidates_token_count", None) if usage else None,
    )


def run_vertex_tool_loop(
    messages: list[dict[str, str]],
    tools: list[dict[str, Any]],
    *,
    execute_tool_fn,
    temperature: float = 0.35,
    max_tokens: int = 600,
    max_rounds: int = 4,
) -> ChatResult:
    """Accumulate Vertex generate_content turns until the model stops requesting tools."""
    from google.genai import types

    tool_activity: list[dict[str, str]] = []
    input_tokens = 0
    output_tokens = 0
    system, turns = _split_system(messages)
    contents: list[Any] = _vertex_contents(turns)
    text = ""

    config_kwargs: dict[str, Any] = {
        "temperature": temperature,
        "max_output_tokens": max_tokens,
        "tools": _vertex_tool_config(tools),
    }
    if system:
        config_kwargs["system_instruction"] = system

    for _ in range(max_rounds):
        response = _vertex_client().models.generate_content(
            model=chat_model(),
            contents=contents,
            config=types.GenerateContentConfig(**config_kwargs),
        )
        usage = getattr(response, "usage_metadata", None)
        if usage:
            input_tokens += getattr(usage, "prompt_token_count", 0) or 0
            output_tokens += getattr(usage, "candidates_token_count", 0) or 0

        text, tool_calls, model_content = _parse_vertex_response(response)
        if model_content is not None:
            contents.append(model_content)

        if not tool_calls:
            break

        result_parts: list[Any] = []
        for call in tool_calls:
            payload = execute_tool_fn(call["name"], call["arguments"])
            tool_activity.append(
                {
                    "tool": call["name"],
                    "arguments": str(call["arguments"]),
                    "result_preview": payload[:240],
                }
            )
            # Vertex expects a JSON-serializable object, not a raw string.
            try:
                parsed = json.loads(payload)
            except json.JSONDecodeError:
                parsed = {"result": payload}
            result_parts.append(
                types.Part.from_function_response(name=call["name"], response=parsed)
            )
        contents.append(types.Content(role="user", parts=result_parts))

    result = ChatResult(
        content=text,
        tool_calls=[],
        input_tokens=input_tokens or None,
        output_tokens=output_tokens or None,
    )
    result.tool_activity = tool_activity  # type: ignore[attr-defined]
    return result


def continue_with_tool_results(
    messages: list[dict[str, str]],
    assistant_tool_calls: list[dict[str, Any]],
    tool_results: list[dict[str, Any]],
    *,
    tools: list[dict[str, Any]] | None = None,
    temperature: float = 0.3,
    max_tokens: int = 500,
) -> ChatResult:
    """OpenAI-style follow-up after tool results (Vertex uses run_vertex_tool_loop instead)."""
    if provider_name() == "vertex":
        # Prefer the dedicated loop; this path is for OpenAI-compatible callers.
        def _noop_execute(name: str, arguments: dict[str, Any]) -> str:
            for result in tool_results:
                if result.get("tool_call_id", "").startswith(name):
                    return result["content"]
            return json.dumps({"error": "missing tool result"})

        return run_vertex_tool_loop(
            messages,
            tools or [],
            execute_tool_fn=_noop_execute,
            temperature=temperature,
            max_tokens=max_tokens,
            max_rounds=1,
        )

    followup: list[dict[str, Any]] = list(messages)
    followup.append(
        {
            "role": "assistant",
            "content": None,
            "tool_calls": [
                {
                    "id": call["id"],
                    "type": "function",
                    "function": {
                        "name": call["name"],
                        "arguments": json.dumps(call["arguments"]),
                    },
                }
                for call in assistant_tool_calls
            ],
        }
    )
    for result in tool_results:
        followup.append(
            {
                "role": "tool",
                "tool_call_id": result["tool_call_id"],
                "content": result["content"],
            }
        )
    return _openai_chat(followup, tools=tools, temperature=temperature, max_tokens=max_tokens)
