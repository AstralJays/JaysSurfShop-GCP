# syntax=docker/dockerfile:1

# (1) Add the Upwind Tracer image as a build stage.
FROM public.ecr.aws/upwindsecurity/images/tracer:0.7.17 AS upwind-tracer

FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py workshop_chain.py .

# (2) Copy the Upwind Tracer binary from the build stage into your workload image.
COPY --from=upwind-tracer /var/lib/upwind /var/lib/upwind

ENV PORT=8080
EXPOSE 8080

# (3) Run the tracer as entrypoint; pass the app command after "--" so the tracer
# wraps functions-framework (Cloud Run Gen2 + ptrace requirement).
ENTRYPOINT ["/var/lib/upwind/upwind-tracer", "--", "functions-framework", "--target=order_webhook", "--port=8080", "--host=0.0.0.0"]
