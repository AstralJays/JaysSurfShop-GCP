# Jay's Surf Shop — GCP workshop

GCP counterpart to [JaysSurfShop](https://github.com/AstralJays/JaysSurfShop) (AWS) and [JaysSurfShop-Azure](https://github.com/AstralJays/JaysSurfShop-Azure).

## Deploy paths

| Path | Compute | Ingress |
|------|---------|---------|
| **Cloud Run** | Serverless containers | Cloud Run URLs |
| **GKE** | Managed Kubernetes | LoadBalancer service |

Adapt the AWS workshop runbook — replace IAM roles with service accounts, S3 with GCS, Lambda with Cloud Functions.
