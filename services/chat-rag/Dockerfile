FROM python:3.12-slim

WORKDIR /app

# Workshop image: intentional CVE-2023-50447 (Pillow 10.0.1) for container scanning demos
LABEL org.opencontainers.image.title="jays-surf-shop-chat-rag" \
      demo.vulnerabilities="true" \
      demo.cve="CVE-2023-50447" \
      demo.purpose="security-workshop"

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r appuser && useradd -r -g appuser -d /app appuser \
    && mkdir -p /app/data/chroma && chown -R appuser:appuser /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir 'pillow==10.0.1'

COPY . .
RUN python setup_poc_images.py && chown -R appuser:appuser /app

USER appuser

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:8001/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
