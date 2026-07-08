# syntax=docker/dockerfile:1

FROM public.ecr.aws/upwindsecurity/images/tracer:0.7.17 AS upwind-tracer

FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r appuser && useradd -r -g appuser -d /app appuser \
    && mkdir -p /app/generated && chown -R appuser:appuser /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --from=upwind-tracer /var/lib/upwind /var/lib/upwind

COPY . .
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8002

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:8002/health || exit 1

ENTRYPOINT ["/var/lib/upwind/upwind-tracer", "--"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
