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
