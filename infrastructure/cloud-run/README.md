# Cloud Run deployment

Deploys Jay's Surf Shop on **Cloud Run** — serverless containers with public ingress (workshop misconfig).

```bash
cp terraform.tfvars.example terraform.tfvars
../../scripts/deploy-cloud-run.sh
```

Backends deploy first; frontend receives their Cloud Run URIs as `CHAT_SERVICE_URL` and `BOARD_SERVICE_URL`.

## Images

Build and push via GitHub Actions ([`.github/workflows/build-push.yml`](../../.github/workflows/build-push.yml)) before deploying. The workflow publishes all four images (`frontend`, `chat-rag`, `board-generator`, `order-webhook`) to Artifact Registry.

## Upwind Tracer on Cloud Run (`order-webhook` only)

Cloud Run uses the embedded **Upwind Tracer** — not the GKE sensor or admission webhook. Only **`order-webhook`** is instrumented; do not add the tracer to GKE or other Cloud Run app images.

### 1. Dockerfile (`infrastructure/function/order-webhook/Dockerfile`)

The image copies `tracer:0.7.15` from ECR and sets `upwind-tracer` as the entrypoint wrapping `functions-framework`.

### 2. Build and push

```bash
# From repo root — order-webhook only (tracer image)
export IMAGE_TAG=latest
docker build --platform linux/amd64 \
  -t "$(cd infrastructure/cloud-run/terraform && terraform output -raw artifact_registry_host)/jays-surf-shop-demo/order-webhook:${IMAGE_TAG}" \
  infrastructure/function/order-webhook
docker push "$(cd infrastructure/cloud-run/terraform && terraform output -raw artifact_registry_host)/jays-surf-shop-demo/order-webhook:${IMAGE_TAG}"
```

Or run `../../scripts/build-push.sh` / GitHub Actions `build-push.yml` for all images.

### 3. Terraform credentials (Secret Manager — do not hardcode secrets)

In `terraform.tfvars`:

```hcl
upwind_client_id     = "..." # Upwind Console → Settings → API Credentials
upwind_client_secret = "..."
```

Terraform stores these in Secret Manager (`jays-surf-shop-demo-upwind-client-id` / `-secret`) and injects them into the Cloud Run service as `UPWIND_TRACER_AUTH_*` env vars. The service uses **Gen2** and:

- `UPWIND_TRACER_EXTENDED_SYSCALLS=true` (L7 / HTTP visibility)
- `UPWIND_TRACER_REPORT_TO_BACKEND=true`

### 4. Deploy

```bash
../../scripts/deploy-cloud-run.sh
```

Verify: `gcloud run services describe jays-surf-shop-demo-order-webhook --region us-central1 --format=yaml` should show Gen2, tracer env vars, and the tracer entrypoint image.

See [gke/README.md](../gke/README.md) for GKE sensor + admission (separate from Cloud Run tracer).

## Workshop findings (intentional)

Same intentional misconfigs as GKE — see [gke/README.md](../gke/README.md).
