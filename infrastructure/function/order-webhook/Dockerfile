# syntax=docker/dockerfile:1

FROM public.ecr.aws/upwindsecurity/images/tracer:0.7.15 AS upwind-tracer

FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

COPY --from=upwind-tracer /var/lib/upwind /var/lib/upwind

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["/var/lib/upwind/upwind-tracer", "--", "functions-framework", "--target=order_webhook", "--port=8080", "--host=0.0.0.0"]
