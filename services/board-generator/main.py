import os
import uuid
import hashlib
import time
import base64
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from openai import OpenAI
from pydantic import BaseModel, Field

from audit_log import audit_ai_inference, audit_event

load_dotenv()

app = FastAPI(title="Jay's Surf Shop — Board Generator", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GENERATED_DIR = Path(__file__).parent / "generated"
GENERATED_DIR.mkdir(exist_ok=True)

IMAGE_MODEL_FALLBACKS = ("gpt-image-1", "gpt-image-1.5", "dall-e-3", "dall-e-2")

BOARD_TYPES = {
    "shortboard": "high-performance shortboard, 6 feet, pointed nose, thruster fins",
    "funboard": "versatile funboard, 7'6\", rounded nose, easy paddling",
    "longboard": "classic longboard, 9 feet, single fin, nose riding shape",
    "fish": "retro fish twin fin, 5'8\", wide swallow tail, 1970s style",
    "gun": "big wave gun, narrow pin tail, serious step-up board",
}

PATTERNS = {
    "solid": "solid single color",
    "gradient": "smooth color gradient fade along the length",
    "stripes": "bold racing stripes running nose to tail",
    "tropical": "tropical floral and palm leaf pattern",
    "geometric": "modern geometric abstract pattern",
    "sunset": "sunset horizon with orange pink and purple sky reflected on deck",
    "wave": "Japanese wave-inspired art style pattern",
}


class BoardDesignRequest(BaseModel):
    board_type: str = Field(default="shortboard", description="shortboard, funboard, longboard, fish, gun")
    primary_color: str = Field(default="ocean blue", max_length=50)
    secondary_color: str = Field(default="white", max_length=50)
    pattern: str = Field(default="gradient", description="solid, gradient, stripes, tropical, geometric, sunset, wave")
    style_notes: str = Field(default="", max_length=300)
    length: str = Field(default="", max_length=20)


class BoardDesignResponse(BaseModel):
    image_url: str
    prompt_used: str
    design_id: str


def image_provider() -> str:
    return os.getenv("IMAGE_PROVIDER", os.getenv("LLM_PROVIDER", "openai")).strip().lower()


def image_model() -> str:
    if image_provider() == "vertex":
        return os.getenv("AI_MODEL", "imagen-3.0-generate-001")
    return os.getenv("AI_MODEL", "gpt-image-1")


def is_configured() -> bool:
    if image_provider() == "vertex":
        return bool(
            os.getenv("GOOGLE_CLOUD_PROJECT")
            or os.getenv("GCP_PROJECT")
            or os.getenv("VERTEX_PROJECT")
        )
    key = os.getenv("OPENAI_API_KEY", "")
    return bool(key) and not key.startswith("sk-your")


def _project_id() -> str:
    return (
        os.getenv("VERTEX_PROJECT")
        or os.getenv("GOOGLE_CLOUD_PROJECT")
        or os.getenv("GCP_PROJECT")
        or ""
    )


def _location() -> str:
    return os.getenv("VERTEX_LOCATION") or os.getenv("GCP_REGION") or "us-central1"


def _is_gpt_image_model(model: str) -> bool:
    return model.startswith("gpt-image") or model.startswith("chatgpt-image")


def _save_image_bytes(data: bytes, design_id: str) -> Path:
    local_path = GENERATED_DIR / f"{design_id}.png"
    local_path.write_bytes(data)
    return local_path


async def _fetch_image_from_response(response, design_id: str) -> None:
    item = response.data[0]

    if item.b64_json:
        _save_image_bytes(base64.b64decode(item.b64_json), design_id)
        return

    if item.url:
        async with httpx.AsyncClient() as http:
            img_response = await http.get(item.url, timeout=60.0)
            img_response.raise_for_status()
            _save_image_bytes(img_response.content, design_id)
        return

    raise HTTPException(status_code=502, detail="No image data returned from OpenAI")


def _build_generate_kwargs(model: str, prompt: str) -> dict:
    kwargs: dict = {
        "model": model,
        "prompt": prompt,
        "n": 1,
    }

    if _is_gpt_image_model(model):
        kwargs["size"] = "1024x1024"
        kwargs["quality"] = "auto"
    elif model == "dall-e-3":
        kwargs["size"] = "1024x1024"
        kwargs["quality"] = "standard"
    else:
        kwargs["size"] = "1024x1024"

    return kwargs


def _models_to_try() -> list[str]:
    preferred = image_model()
    models = [preferred]
    for candidate in IMAGE_MODEL_FALLBACKS:
        if candidate not in models:
            models.append(candidate)
    return models


def build_prompt(req: BoardDesignRequest) -> str:
    board_desc = BOARD_TYPES.get(req.board_type.lower(), BOARD_TYPES["shortboard"])
    pattern_desc = PATTERNS.get(req.pattern.lower(), PATTERNS["gradient"])
    length_part = f", {req.length} long" if req.length else ""

    style_part = f" Additional style: {req.style_notes}." if req.style_notes else ""

    return (
        f"Professional product photography of a custom surfboard on a clean white studio background. "
        f"The board is a {board_desc}{length_part}. "
        f"Deck design: {pattern_desc} using {req.primary_color} as primary color "
        f"and {req.secondary_color} as accent.{style_part} "
        f"Top-down three-quarter view showing full board shape and artwork. "
        f"Photorealistic, high detail, glossy finish, no text or logos, no people, no water."
    )


def _generate_vertex_image(prompt: str, design_id: str) -> str:
    from google import genai
    from google.genai import types

    client = genai.Client(vertexai=True, project=_project_id(), location=_location())
    model = image_model()
    response = client.models.generate_images(
        model=model,
        prompt=prompt,
        config=types.GenerateImagesConfig(
            number_of_images=1,
            aspect_ratio="1:1",
        ),
    )
    generated = getattr(response, "generated_images", None) or []
    if not generated:
        raise RuntimeError("Imagen returned no images")
    image = generated[0].image
    data = getattr(image, "image_bytes", None)
    if not data:
        raise RuntimeError("Imagen response missing image bytes")
    _save_image_bytes(data, design_id)
    return model


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": os.getenv("SERVICE_NAME", "board-generator"),
        "environment": os.getenv("ENVIRONMENT", "local"),
        "image_provider": image_provider(),
        "image_configured": is_configured(),
        "ai_models": [image_model()],
        "monitoring": ["cspm", "ai-spm", "container-runtime", "cloud-xdr"],
    }


@app.get("/options")
def options():
    return {
        "board_types": list(BOARD_TYPES.keys()),
        "patterns": list(PATTERNS.keys()),
        "color_suggestions": [
            "ocean blue", "sunset orange", "seafoam green", "coral pink",
            "midnight black", "sand beige", "electric yellow", "deep purple",
        ],
    }


@app.get("/images/{design_id}")
def get_image(design_id: str):
    path = GENERATED_DIR / f"{design_id}.png"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(path, media_type="image/png")


@app.post("/generate", response_model=BoardDesignResponse)
async def generate_board(req: BoardDesignRequest):
    if not is_configured():
        raise HTTPException(status_code=503, detail="Image provider not configured")

    prompt = build_prompt(req)
    design_id = str(uuid.uuid4())[:8]
    prompt_hash = hashlib.sha256(prompt.encode()).hexdigest()[:16]
    started = time.perf_counter()
    model_used = ""
    last_error: Exception | None = None

    try:
        if image_provider() == "vertex":
            model_used = _generate_vertex_image(prompt, design_id)
        else:
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            for model in _models_to_try():
                try:
                    kwargs = _build_generate_kwargs(model, prompt)
                    response = client.images.generate(**kwargs)
                    await _fetch_image_from_response(response, design_id)
                    model_used = model
                    break
                except Exception as exc:
                    last_error = exc
                    err = str(exc).lower()
                    if "model" in err and ("does not exist" in err or "invalid" in err):
                        continue
                    raise
            else:
                raise last_error or HTTPException(status_code=502, detail="No image model available")

        audit_ai_inference(
            model=model_used,
            operation="image_generation",
            latency_ms=int((time.perf_counter() - started) * 1000),
            user_prompt_hash=prompt_hash,
            success=True,
        )
        audit_event("ai_asset_created", design_id=design_id, storage="local")

    except HTTPException:
        raise
    except Exception as e:
        audit_ai_inference(
            model=model_used or "unknown",
            operation="image_generation",
            user_prompt_hash=prompt_hash,
            success=False,
            error=str(e),
        )
        raise HTTPException(status_code=502, detail=f"Image generation failed: {e}") from e

    return BoardDesignResponse(
        image_url=f"/images/{design_id}",
        prompt_used=prompt,
        design_id=design_id,
    )
