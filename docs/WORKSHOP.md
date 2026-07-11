# GCP Workshop Runbook

## Identity attack paths (CNAPP demo)

This deployment models the three identity risks security teams prioritize on GCP:

### 1. Metadata server token theft (T1552.005 / T1078)

**Misconfiguration:** GKE pod runs with `roles/editor` via Workload Identity (`jayssurfshopdemo-app`).

**Kill chain:** Pillow RCE → `curl metadata.google.internal/.../token` → use token for GCS / Secret Manager.

**PoC:** Container Runtime → **Metadata server token theft**

**Detect:** Metadata access from workload, then `storage.buckets.list` / `secretmanager.secrets.list` from same pod.

### 2. Service account impersonation (T1550 / T1078)

**Misconfiguration:** Compromised dev SA (`jayssurfshopdemo-dev`) has `roles/iam.serviceAccountTokenCreator` on production SA (`jayssurfshopdemo-prod`).

**Kill chain:** Find leaked dev key → `GenerateAccessToken` for prod SA → read production secrets.

**PoC:** Cloud XDR → **Service account impersonation**

**Detect:** `iamcredentials.googleapis.com` `GenerateAccessToken` from dev principal targeting prod SA.

### 3. Service account key theft (T1552)

**Misconfiguration:** Long-lived JSON key for dev SA committed to container image / CI artifacts GCS path.

**Kill chain:** RCE → read `/var/run/demo/leaked-dev-sa.json` → `gcloud auth activate-service-account`.

**PoC:** Cloud XDR → **Service account key theft**

**Detect:** Dormant key activation, key age > 90 days, login from unexpected geography.

### Bonus: VM + actAs indirect escalation

**Misconfiguration:** Dev SA has `compute.instanceAdmin.v1` + `iam.serviceAccounts.actAs` on prod SA.

**Kill chain:** Create VM with prod SA attached → SSH → metadata token as prod.

**PoC:** Cloud XDR → **VM + actAs indirect escalation**

**Detect:** `compute.instances.insert` with foreign service account + graph path to Secret Manager.

## Deploy

```bash
./infrastructure/scripts/apply-ci.sh gke
./infrastructure/scripts/deploy-gke.sh
```

Open `/security` on the frontend LoadBalancer URL.

## Upwind demo map

Use the right Upwind product for each compute path — they are not interchangeable.

| Compute | Upwind mechanisms | Demo focus |
|---------|-------------------|------------|
| **GKE** (frontend, chat-rag, board-generator) | **Sensor** (node scan agents) + **Admission Controller** (webhook) | Container runtime PoCs on `/security`; deploy-time policy violations via admission |
| **Cloud Run / serverless** (order-webhook) | **Tracer** (embedded in image) | EICAR upload, PyYAML CVE, serverless runtime |

### GKE — sensor (runtime)

- Installed by `upwind.tf` when credentials are set in GKE `terraform.tfvars`.
- Node scan agents on the cluster; no tracer in GKE container images.
- Run container PoCs from the security dashboard (shell redirect, crypto miner DNS, package managers, etc.).

### GKE — admission control (deploy-time)

- Installed by `upwind_admission.tf` (requires cert-manager).
- Validates Kubernetes create/update requests before workloads run.
- Create Admission Controller policies in the Upwind console (Audit first, then Block).

Verify:

```bash
kubectl get pods -n upwind -l app.kubernetes.io/name=upwind-admission-webhook
kubectl get validatingwebhookconfiguration upwind-admission-webhook
```

### Cloud Run — tracer (runtime)

- `order-webhook` image built with Upwind tracer in CI (`build-push.yml`).
- Separate from GKE sensor/admission — serverless has no node agents or admission webhook.
- PoCs: `/demo/eicar`, `/checkout` with malicious YAML payload.
