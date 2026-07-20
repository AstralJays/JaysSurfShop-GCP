import { NextResponse } from "next/server";
import { proxyChat } from "@/lib/demoLab";
import { ORDER_WEBHOOK_URL, proxyOrderWebhook, type OrderWebhookStatus } from "@/lib/orderWebhook";

function detectCompute(): string {
  if (process.env.KUBERNETES_SERVICE_HOST) return "gke";
  if (process.env.K_SERVICE) return "cloud-run";
  if (process.env.GCP_REGION) return "gcp";
  return "container";
}

const BASE = {
  application: "jays-surf-shop",
  environment: process.env.NEXT_PUBLIC_APP_ENV || process.env.ENVIRONMENT || "local",
  deployment_id: process.env.DEPLOYMENT_ID || "local",
  compute: detectCompute(),
  attack_surface: {
    public: [
      { path: "/", note: "Shop catalog" },
      { path: "/login", note: "Customer sign-in (demo passwords exposed)" },
      { path: "/orders", note: "My orders (session cookie)" },
      { path: "/chat", note: "Maya support assistant (Vertex + order tools)" },
      { path: "/design", note: "Create-A-Board UI" },
      { path: "/admin", note: "Staff ops — middleware bypassable (CVE-2025-29927)" },
      { path: "/api/chat", note: "Maya → Vertex Gemini + order tools" },
      { path: "/api/auth/login", note: "Customer login API" },
      { path: "/api/board", note: "Create-A-Board generate + designs gallery" },
      { path: "/api/board/preview", note: "Create-A-Board deck preview (Pillow sink)" },
      { path: "/api/orders/mine", note: "Orders — BOLA via ?email= query" },
      { path: "/api/checkout", note: "Cart checkout → order webhook" },
      { path: "/api/downloads/asset", note: "Document download (path traversal)" },
      { path: "/api/community/tips", note: "Community tips → Maya knowledge" },
      { path: "/api/admin/knowledge/rebuild", note: "Staff knowledge rebuild (weak auth)" },
      { path: "/api/chat", note: "Maya support chat" },
      {
        path: "https://storage.googleapis.com/…/exports/customer-export.json",
        note: "Public GCS customer export (allUsers)",
      },
    ],
    private: [
      { path: "/admin", note: "Staff ops — middleware cookie gate (CVE-2025-29927 bypassable)" },
      { path: "chat-rag:8001/chat", note: "Internal only — attacks go through public /api/chat" },
      { path: "chat-rag:8001/auth/*", note: "Internal only — use /api/auth/* from the edge" },
      { path: "chat-rag:8001/orders/mine", note: "Internal only — use /api/orders/mine" },
      { path: "board-generator:8002/generate", note: "Internal only — use /api/board" },
    ],
    external: ["vertex-ai", "openai-api (optional)"],
    secrets: ["Workload Identity → Vertex; openai-api-key optional (Secret Manager)"],
  },
};

interface DemoStatus {
  gcp_runtime?: boolean;
  pillow_installed?: string | null;
  langchain_community_version?: string | null;
  chromadb_version?: string | null;
}

function buildFindings(
  env: string,
  demo: DemoStatus,
  orderWebhook: OrderWebhookStatus | null,
  orderWebhookConfigured: boolean
) {
  const gcp =
    demo.gcp_runtime === true ||
    orderWebhook?.gcp_runtime === true ||
    Boolean(process.env.GCP_REGION || process.env.KUBERNETES_SERVICE_HOST);
  const local = env === "local" || env === "demo-local";
  const pillow = demo.pillow_installed ?? null;
  const pyyaml = orderWebhook?.pyyaml_version ?? null;

  const cves = [];
  if (pillow) {
    cves.push({
      cve: "CVE-2023-50447",
      package: `pillow ${pillow}`,
      severity: "HIGH",
      service: "chat-rag",
      active: true,
      exploitable: true,
    });
  }
  const langchain = demo.langchain_community_version ?? null;
  if (langchain) {
    cves.push({
      cve: "CVE-2024-5998",
      package: `langchain-community ${langchain}`,
      severity: "HIGH",
      service: "chat-rag",
      active: true,
      exploitable: true,
    });
  }
  const chromadb = demo.chromadb_version ?? null;
  if (chromadb) {
    cves.push({
      cve: "CVE-2026-45831",
      package: `chromadb ${chromadb}`,
      severity: "HIGH",
      service: "chat-rag",
      active: true,
      exploitable: true,
    });
  }
  cves.push({
    cve: "CVE-2025-55182",
    package: "next 15.1.0 / react 19.0.0",
    severity: "Critical",
    service: "frontend",
    active: true,
    exploitable: true,
  });
  cves.push({
    cve: "CVE-2025-66478",
    package: "next 15.1.0 (App Router RSC)",
    severity: "Critical",
    service: "frontend",
    active: true,
    exploitable: true,
  });
  cves.push({
    cve: "CVE-2025-29927",
    package: "next 15.1.0 (middleware auth bypass)",
    severity: "Critical",
    service: "frontend",
    active: true,
    exploitable: true,
  });
  if (pyyaml && orderWebhookConfigured) {
    cves.push({
      cve: "CVE-2020-14343",
      package: `pyyaml ${pyyaml}`,
      severity: "HIGH",
      service: "order-webhook",
      active: true,
      exploitable: true,
    });
  }

  const attackSurfacePublic = [...BASE.attack_surface.public];
  if (orderWebhookConfigured) {
    attackSurfacePublic.push({
      path: ORDER_WEBHOOK_URL,
      note: "Public Cloud Function HTTPS URL — no auth, ingress ALLOW_ALL (CSPM finding)",
    });
    attackSurfacePublic.push({
      path: `${ORDER_WEBHOOK_URL}/checkout`,
      note: "Unauthenticated checkout → order webhook; fulfillmentManifest triggers PyYAML kill chain",
    });
    attackSurfacePublic.push({
      path: `${ORDER_WEBHOOK_URL}/demo/eicar`,
      note: "Unauthenticated EICAR demo (callable from internet)",
    });
    attackSurfacePublic.push({
      path: `${ORDER_WEBHOOK_URL}/demo/yaml`,
      note: "Unauthenticated PyYAML exploit demo",
    });
    attackSurfacePublic.push({
      path: `${ORDER_WEBHOOK_URL}/demo/eicar-file`,
      note: "EICAR file write — Cloud Run tracer File events",
    });
    attackSurfacePublic.push({
      path: `${ORDER_WEBHOOK_URL}/demo/shell-pipe`,
      note: "Shell pipe redirect — Cloud Run tracer Process events",
    });
  }

  return {
    exploit_lab_enabled: true,
    gcp_runtime: gcp,
    function_enabled: orderWebhookConfigured && (orderWebhook?.gcp_runtime ?? gcp),
    is_local: local,
    eicar_present: orderWebhook?.eicar_present === true,
    cspm_misconfigurations: [
      {
        id: "public-gcs",
        finding: "Public GCS bucket with synthetic customer export",
        severity: "Critical",
        active: gcp,
        trigger: "Terraform (always deployed)",
      },
      {
        id: "sa-editor",
        finding: "GKE workload SA bound to roles/editor (metadata token → full project access)",
        severity: "Critical",
        active: gcp,
        trigger: "Terraform (always deployed)",
      },
      {
        id: "sa-impersonation-chain",
        finding: "Dev SA has serviceAccountTokenCreator on production SA",
        severity: "Critical",
        active: gcp,
        trigger: "Terraform (identity workshop)",
      },
      {
        id: "sa-key-leak",
        finding: "Long-lived dev SA key embedded in container / CI artifacts bucket",
        severity: "Critical",
        active: gcp,
        trigger: "Terraform (identity workshop)",
      },
      {
        id: "vm-actas-escalation",
        finding: "Dev SA has compute.instanceAdmin + iam.serviceAccounts.actAs on prod SA",
        severity: "High",
        active: gcp,
        trigger: "Terraform (identity workshop)",
      },
      {
        id: "ssh-firewall",
        finding: "SSH (22) open to 0.0.0.0/0 on VPC firewall",
        severity: "High",
        active: gcp,
        trigger: "Terraform (always deployed)",
      },
      {
        id: "public-cloud-function",
        finding: "Cloud Function order-webhook invokable by allUsers with ALLOW_ALL ingress",
        severity: "Critical",
        active: orderWebhookConfigured && gcp,
        trigger: "Terraform (always deployed)",
      },
      {
        id: "function-overprivileged",
        finding: "Cloud Function SA: roles/editor on project",
        severity: "Critical",
        active: orderWebhookConfigured && gcp,
        trigger: "Terraform (always deployed)",
      },
      {
        id: "function-eicar",
        finding: "Order webhook Cloud Function package contains EICAR test string",
        severity: "Medium",
        active: orderWebhookConfigured && orderWebhook?.eicar_present === true,
        trigger: "Cloud Function deployment package",
      },
      {
        id: "chat-rag-exposed",
        finding: "chat-rag published on host port 8001",
        severity: "Medium",
        active: local,
        trigger: "docker-compose port mapping",
      },
    ],
    active_cves: cves,
    iam_misconfigurations: [
      {
        role: "jayssurfshopdemo-app@PROJECT.iam.gserviceaccount.com",
        finding: "roles/editor on GKE workload (metadata token theft risk)",
        details: "T1552.005 — attached to all chat-rag pods via Workload Identity",
        severity: "Critical",
        active: gcp,
        trigger: "Terraform (always deployed)",
      },
      {
        role: "jayssurfshopdemo-prod@PROJECT.iam.gserviceaccount.com",
        finding: "Production SA — Secret Manager Admin + Storage Object Admin",
        details: "Target of impersonation / VM actAs escalation chain",
        severity: "Critical",
        active: gcp,
        trigger: "Terraform (identity workshop)",
      },
      {
        role: "jayssurfshopdemo-dev@PROJECT.iam.gserviceaccount.com",
        finding: "Compromised dev SA — TokenCreator + actAs on prod + compute.instanceAdmin",
        details: "T1550 / T1078 — key leaked to image; can impersonate or spawn VM",
        severity: "Critical",
        active: gcp,
        trigger: "Terraform (identity workshop)",
      },
      {
        role: "jayssurfshopdemo-order-wh@PROJECT.iam.gserviceaccount.com",
        finding: "roles/editor on project (Cloud Function runtime SA)",
        details: "storage.*, secretmanager.*, iam.* via project Editor role",
        severity: "Critical",
        active: orderWebhookConfigured && gcp,
        trigger: "Terraform (always deployed)",
      },
    ],
    attack_surface_public: attackSurfacePublic,
  };
}

export async function GET() {
  let demo: DemoStatus = {};
  try {
    const res = await proxyChat("/health");
    if (res.ok) demo = await res.json();
  } catch {
    /* chat-rag unreachable */
  }

  let orderWebhook: OrderWebhookStatus | null = null;
  const orderWebhookConfigured = Boolean(ORDER_WEBHOOK_URL);
  if (orderWebhookConfigured) {
    try {
      const res = await proxyOrderWebhook("/status");
      if (res.ok) orderWebhook = await res.json();
    } catch {
      /* function unreachable */
    }
  }

  const findings = buildFindings(BASE.environment, demo, orderWebhook, orderWebhookConfigured);

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      event_type: "security_posture_check",
      service: "frontend",
      environment: BASE.environment,
      exploit_lab: true,
      function_enabled: findings.function_enabled,
    })
  );

  return NextResponse.json({
    ...BASE,
    attack_surface: {
      ...BASE.attack_surface,
      public: findings.attack_surface_public,
    },
    findings: {
      exploit_lab_enabled: findings.exploit_lab_enabled,
      gcp_runtime: findings.gcp_runtime,
      function_enabled: findings.function_enabled,
      is_local: findings.is_local,
      eicar_present: findings.eicar_present,
      cspm_misconfigurations: findings.cspm_misconfigurations,
      active_cves: findings.active_cves,
      iam_misconfigurations: findings.iam_misconfigurations,
    },
  });
}
