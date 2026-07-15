"""Embedding backends for Chroma (Vertex on GCP, OpenAI fallback)."""
from __future__ import annotations

import os
from typing import cast

import chromadb.utils.embedding_functions as embedding_functions
from chromadb.api.types import Documents, EmbeddingFunction, Embeddings

from llm_provider import embed_model, is_configured, provider_name, _location, _project_id


class VertexEmbeddingFunction(EmbeddingFunction[Documents]):
    def __init__(self, model_id: str | None = None) -> None:
        from google import genai

        self.model_id = model_id or embed_model()
        self.client = genai.Client(
            vertexai=True,
            project=_project_id(),
            location=_location(),
        )

    def __call__(self, input: Documents) -> Embeddings:
        vectors: Embeddings = []
        for text in input:
            result = self.client.models.embed_content(
                model=self.model_id,
                contents=text,
            )
            values: list[float] | None = None
            embeddings = getattr(result, "embeddings", None)
            if embeddings:
                values = list(getattr(embeddings[0], "values", None) or [])
            if not values:
                emb = getattr(result, "embedding", None)
                values = list(getattr(emb, "values", None) or []) if emb else None
            if not values:
                raise RuntimeError("Vertex embedding response missing values")
            vectors.append(cast(list[float], values))
        return vectors


def get_embedding_function() -> EmbeddingFunction[Documents]:
    if provider_name() == "vertex" and is_configured():
        return VertexEmbeddingFunction()
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise RuntimeError("No embedding provider configured")
    return embedding_functions.OpenAIEmbeddingFunction(
        api_key=api_key,
        model_name=embed_model(),
    )
