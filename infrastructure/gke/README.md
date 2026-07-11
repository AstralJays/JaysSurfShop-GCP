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
| `order-webhook` | Serverless order webhook (not deployed on GKE) |

## Upwind on GKE (optional)

Set `upwind_client_id` and `upwind_client_secret` in `terraform.tfvars`, then re-run `deploy-gke.sh`. This installs **two separate Upwind mechanisms** on the cluster — not the Cloud Run tracer.

| Upwind product | Terraform / Helm | What it does |
|----------------|------------------|--------------|
| **Sensor** | `upwind.tf` — operator + node scan agents (`scanAgent.sidecar: false`) | Runtime detection on pods (processes, network, drift). GKE workload images have **no** embedded tracer. |
| **Admission Controller** | `upwind_admission.tf` — admission webhook + cert-manager | Deploy-time guardrails via Kubernetes validating webhook (OPA policies + audit). Configure policies in the Upwind console. |

These are independent layers: sensor watches running workloads; admission controller evaluates manifests at create/update time. Tracer injection on the admission chart is **disabled** so it does not duplicate the node scan agents.

After apply, verify admission webhook:

```bash
kubectl get pods -n upwind -l app.kubernetes.io/name=upwind-admission-webhook
kubectl get validatingwebhookconfiguration upwind-admission-webhook
```
