<h1 align="center">Jay's Surf Shop — GCP</h1>

<p align="center">
  <img src="frontend/public/logo.png" alt="Jay's Surf Shop logo" width="180" />
</p>

<p align="center">
  GCP twin of <a href="https://github.com/AstralJays/JaysSurfShop">JaysSurfShop</a> — the same intentionally vulnerable surf shop for security workshops, deployable on <strong>GKE</strong> or <strong>Cloud Run</strong>.
</p>

<p align="center">
  <a href="https://github.com/AstralJays/JaysSurfShop-GCP">github.com/AstralJays/JaysSurfShop-GCP</a>
</p>

> [!CAUTION]
> **Do not deploy to production accounts.**

## Architecture

```
Internet → frontend (GKE LoadBalancer or Cloud Run)
              ├── chat-rag (private / internal)
              └── board-generator (private / internal)

Internet → Cloud Function → order-webhook (EICAR + PyYAML CVE)
              ↑ checkout from cart
```

| Service | Stack | Port |
|---------|-------|------|
| **frontend** | Next.js 15 | 3000 |
| **chat-rag** | FastAPI, ChromaDB, OpenAI | 8001 |
| **board-generator** | FastAPI, image generation | 8002 |
| **order-webhook** | Cloud Functions Gen2 (Python) | HTTP |

## Quick start (local)

```bash
cp .env.example .env
# Set OPENAI_API_KEY
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000) · security dashboard at [/security](http://localhost:3000/security)

## Deploy to GCP

Choose **GKE** or **Cloud Run**. Both share VNet, Artifact Registry, Secret Manager, Cloud Storage, Cloud Function, and GitHub Workload Identity via `infrastructure/modules/workshop/`.

```bash
# 1. CI bootstrap (Artifact Registry + GitHub WIF)
./infrastructure/scripts/apply-ci.sh

# 2. Add GitHub secrets from terraform output:
#    GCP_WORKLOAD_IDENTITY_PROVIDER, GCP_DEPLOY_SERVICE_ACCOUNT,
#    GCP_ARTIFACT_REGISTRY_HOST, GCP_REGION, GCP_PROJECT_ID

# 3. Run "Build and Push Images" in Actions

# 4. Full stack
cp infrastructure/cloud-run/terraform/terraform.tfvars.example \
   infrastructure/cloud-run/terraform/terraform.tfvars
# Set project_id and openai_api_key
./infrastructure/scripts/deploy-cloud-run.sh   # or: deploy-gke.sh
```

See [infrastructure/gke/README.md](infrastructure/gke/README.md) and [infrastructure/cloud-run/README.md](infrastructure/cloud-run/README.md).

## Multi-cloud repos

| Cloud | Repo | Compute options |
|-------|------|-----------------|
| AWS | [JaysSurfShop](https://github.com/AstralJays/JaysSurfShop) | ECS Fargate, EKS |
| Azure | [JaysSurfShop-Azure](https://github.com/AstralJays/JaysSurfShop-Azure) | Container Apps, AKS |
| GCP | **JaysSurfShop-GCP** | Cloud Run, GKE |

## License

MIT
