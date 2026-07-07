# Cloud Run deployment

Deploys Jay's Surf Shop on **Cloud Run** — serverless containers with public ingress (workshop misconfig).

```bash
cp terraform.tfvars.example terraform.tfvars
../../scripts/deploy-cloud-run.sh
```

Backends deploy first; frontend receives their Cloud Run URIs as `CHAT_SERVICE_URL` and `BOARD_SERVICE_URL`.

## Workshop findings (intentional)

Same intentional misconfigs as GKE — see [gke/README.md](../gke/README.md).
