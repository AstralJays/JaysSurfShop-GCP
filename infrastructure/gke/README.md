# GKE deployment

Deploys Jay's Surf Shop on **Google Kubernetes Engine** with workload identity, three Deployments, and a public LoadBalancer for the frontend.

```bash
cp terraform.tfvars.example terraform.tfvars
../../scripts/deploy-gke.sh
```

## Workshop findings (intentional)

- VPC firewall allows SSH from `0.0.0.0/0`
- App service account has project **Editor**
- Public GCS bucket with synthetic customer export
- Unauthenticated Cloud Function (order-webhook)

## Images

All container images are built and pushed by GitHub Actions ([`.github/workflows/build-push.yml`](../../.github/workflows/build-push.yml)) — not during `deploy-gke.sh`. After a successful workflow run, set `image_tag` in `terraform.tfvars` to the commit SHA (or `latest`), then deploy.

| Image | Used by |
|-------|---------|
| `frontend` | GKE Deployment / Cloud Run |
| `chat-rag` | GKE Deployment / Cloud Run |
| `board-generator` | GKE Deployment / Cloud Run |
| `order-webhook` | Cloud Run (shared order webhook) |

## Upwind runtime (optional)

Set `upwind_client_id` and `upwind_client_secret` in `terraform.tfvars`, then re-run `deploy-gke.sh`. Installs the Upwind Helm operator on the cluster (node scan agents; no Dockerfile tracer on GKE workloads).

The order webhook Cloud Run service uses an embedded Upwind tracer when the same credentials are set — image is built by CI (`order-webhook` in the build-push workflow).
