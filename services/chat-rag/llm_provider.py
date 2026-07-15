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
        return os.getenv("AI_MODEL_CHAT", "gemini-2.0-flash-001")
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
    if tools:
        # Vertex function calling — optional; shop chat currently unused without tools.
        decls = [
            types.FunctionDeclaration(
                name=tool["name"],
                description=tool["description"],
                parameters=tool["parameters"],
            )
            for tool in tools
        ]
        config_kwargs["tools"] = [types.Tool(function_declarations=decls)]

    response = _vertex_client().models.generate_content(
        model=chat_model(),
        contents=_vertex_contents(turns),
        config=types.GenerateContentConfig(**config_kwargs),
    )

    text = (response.text or "").strip() if hasattr(response, "text") else ""
    if not text and getattr(response, "candidates", None):
        parts: list[str] = []
        for cand in response.candidates:
            content = getattr(cand, "content", None)
            for part in getattr(content, "parts", None) or []:
                if getattr(part, "text", None):
                    parts.append(part.text)
        text = "\n".join(parts).strip()

    usage = getattr(response, "usage_metadata", None)
    return ChatResult(
        content=text,
        tool_calls=[],
        input_tokens=getattr(usage, "prompt_token_count", None) if usage else None,
        output_tokens=getattr(usage, "candidates_token_count", None) if usage else None,
    )
