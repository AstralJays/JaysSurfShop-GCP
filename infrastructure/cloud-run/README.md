# Cloud Run deployment

Deploys Jay's Surf Shop on **Cloud Run** — serverless containers with public ingress (workshop misconfig).

```bash
cp terraform.tfvars.example terraform.tfvars
../../scripts/deploy-cloud-run.sh
```

Backends deploy first; frontend receives their Cloud Run URIs as `CHAT_SERVICE_URL` and `BOARD_SERVICE_URL`.

## Images

Build and push via GitHub Actions ([`.github/workflows/build-push.yml`](../../.github/workflows/build-push.yml)) before deploying. The workflow publishes all four images (`frontend`, `chat-rag`, `board-generator`, `order-webhook`) to Artifact Registry for both Cloud Run and GKE paths.

The shared **order-webhook** deploys as Cloud Run Gen2 with an optional embedded Upwind tracer. Set `upwind_client_id` / `upwind_client_secret` in `terraform.tfvars`, run the CI workflow, then `terraform apply`.

## Workshop findings (intentional)

Same intentional misconfigs as GKE — see [gke/README.md](../gke/README.md).
