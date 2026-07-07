<h1 align="center">Jay's Surf Shop — GCP</h1>

<p align="center">
  <img src="frontend/public/logo.png" alt="Jay's Surf Shop logo" width="180" />
</p>

<p align="center">
  GCP twin of <a href="https://github.com/AstralJays/JaysSurfShop">JaysSurfShop</a> — the same intentionally vulnerable surf shop for security workshops — CSPM, container runtime, AI SPM, and XDR demos. Deploy on <strong>GKE</strong> or <strong>Cloud Run</strong>.
</p>

<p align="center">
  <a href="https://github.com/AstralJays/JaysSurfShop-GCP">github.com/AstralJays/JaysSurfShop-GCP</a>
</p>

> [!CAUTION]
> **Do not deploy to production accounts.**

## Architecture

```
Internet → frontend (GKE LoadBalancer or Cloud Run)
              ├── chat-rag (RAG + GPT-4o-mini, CVE-2023-50447)
              └── board-generator (DALL·E / gpt-image)

Internet → Cloud Function → order-webhook (EICAR + PyYAML CVE-2020-14343)
              ↑ checkout from cart
```

| Service | Stack | Port / entry |
|---------|-------|--------------|
| **frontend** | Next.js 15, React, Tailwind | 3000 |
| **chat-rag** | FastAPI, ChromaDB, OpenAI, exploit lab | 8001 |
| **board-generator** | FastAPI, image generation | 8002 |
| **order-webhook** | Python Cloud Functions Gen2 | `/checkout`, `/demo/*` |

## Quick start (local)

Same app as the AWS repo — identical `frontend/`, `services/`, and `docker-compose.yml`:

```bash
cp .env.example .env
# Set OPENAI_API_KEY

docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000) · security dashboard at [/security](http://localhost:3000/security)

Vulnerabilities are on by default: pillow CVE, exploit endpoints, path traversal, chat-rag on port 8001. On GCP: public GCS bucket export, overprivileged service accounts, open SSH firewall rule, and anonymous Cloud Function routes (EICAR + PyYAML CVE).

## Deploy to GCP

Choose **Cloud Run** or **GKE** — both share VPC, Artifact Registry, Secret Manager, Cloud Storage, Cloud Function, and GitHub Workload Identity via `infrastructure/modules/workshop/`.

```bash
# 1. CI bootstrap (Artifact Registry + GitHub WIF)
./infrastructure/scripts/apply-ci.sh cloud-run   # or: gke

# 2. Add GitHub secrets (printed by apply-ci.sh):
#    GCP_PROJECT_ID, GCP_REGION, GCP_WORKLOAD_IDENTITY_PROVIDER,
#    GCP_DEPLOY_SERVICE_ACCOUNT, GCP_ARTIFACT_REGISTRY_HOST

# 3. Run "Build and Push Images" in Actions (or build-push.sh locally)

# 4. Full stack
cp infrastructure/cloud-run/terraform/terraform.tfvars.example \
   infrastructure/cloud-run/terraform/terraform.tfvars
# Set project_id and openai_api_key in terraform.tfvars
./infrastructure/scripts/deploy-cloud-run.sh   # or: deploy-gke.sh
```

See [infrastructure/gke/README.md](infrastructure/gke/README.md) and [infrastructure/cloud-run/README.md](infrastructure/cloud-run/README.md).

The workflow [`.github/workflows/build-push.yml`](.github/workflows/build-push.yml) builds all three images and pushes to Artifact Registry on push to `main` (or manual dispatch).

Workshop runbook: **[docs/WORKSHOP.md](docs/WORKSHOP.md)**

## Multi-cloud repos

| Cloud | Repo | Compute options |
|-------|------|-----------------|
| AWS | [JaysSurfShop](https://github.com/AstralJays/JaysSurfShop) | ECS Fargate, EKS |
| Azure | [JaysSurfShop-Azure](https://github.com/AstralJays/JaysSurfShop-Azure) | Container Apps, AKS |
| GCP | **JaysSurfShop-GCP** | Cloud Run, GKE |

## Project structure

```
JaysSurfShop-GCP/
├── docs/WORKSHOP.md
├── infrastructure/
│   ├── modules/workshop/        # VPC, Artifact Registry, Secret Manager, GCS, Function, GitHub WIF
│   ├── gke/terraform/           # GKE + Kubernetes workloads
│   ├── cloud-run/terraform/
│   ├── function/order-webhook/  # checkout Function (EICAR + PyYAML CVE)
│   └── scripts/                 # apply-ci, deploy-gke/cloud-run, build-push
├── frontend/
├── services/
└── docker-compose.yml
```

## License

MIT
