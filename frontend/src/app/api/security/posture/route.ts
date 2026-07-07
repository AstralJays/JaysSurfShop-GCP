import { NextResponse } from "next/server";
import { proxyChat } from "@/lib/demoLab";
import { ORDER_WEBHOOK_URL, proxyOrderWebhook, type OrderWebhookStatus } from "@/lib/orderWebhook";

const BASE = {
  application: "jays-surf-shop",
  environment: process.env.NEXT_PUBLIC_APP_ENV || process.env.ENVIRONMENT || "local",
  deployment_id: process.env.DEPLOYMENT_ID || "local",
  compute: process.env.AWS_EXECUTION_ENV ? "aws-ecs-fargate" : "container",
  attack_surface: {
    public: [
      { path: "/", note: "Shop catalog" },
      { path: "/chat", note: "Shop Crew UI" },
      { path: "/design", note: "Create-A-Board UI" },
      { path: "/api/chat", note: "Unauthenticated → OpenAI" },
      { path: "/api/board", note: "Unauthenticated → image gen" },
      { path: "/api/checkout", note: "Cart checkout → order webhook Lambda" },
      { path: "/api/security/posture", note: "Posture metadata" },
      { path: "/api/security/demo/*", note: "PoC proxy" },
    ],
    private: [
      { path: "chat-rag:8001/chat", note: "RAG + GPT-4o-mini" },
      { path: "chat-rag:8001/demo/exploit/*", note: "Exploit lab" },
      { path: "chat-rag:8001/reindex", note: "Unauthenticated admin (local compose)" },
      { path: "board-generator:8002/generate", note: "DALL·E / gpt-image" },
    ],
    external: ["openai-api"],
    secrets: ["openai-api-key (Secrets Manager on AWS)"],
  },
};

interface DemoStatus {
  aws_runtime?: boolean;
  pillow_installed?: string | null;
}

function buildFindings(
  env: string,
  demo: DemoStatus,
  lambda: OrderWebhookStatus | null,
  orderWebhookConfigured: boolean
) {
  const aws = demo.aws_runtime === true || lambda?.aws_runtime === true;
  const local = env === "local" || env === "demo-local";
  const pillow = demo.pillow_installed ?? null;
  const pyyaml = lambda?.pyyaml_version ?? null;

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
      note: "Public execute-api endpoint — no auth, no API key (CSPM finding)",
    });
    attackSurfacePublic.push({
      path: `${ORDER_WEBHOOK_URL}/checkout`,
      note: "Unauthenticated checkout → order webhook Lambda",
    });
    attackSurfacePublic.push({
      path: `${ORDER_WEBHOOK_URL}/demo/eicar`,
      note: "Unauthenticated EICAR demo (callable from internet)",
    });
    attackSurfacePublic.push({
      path: `${ORDER_WEBHOOK_URL}/demo/yaml`,
      note: "Unauthenticated PyYAML exploit demo",
    });
  }

  return {
    exploit_lab_enabled: true,
    aws_runtime: aws,
    lambda_enabled: orderWebhookConfigured && (lambda?.aws_runtime ?? aws),
    is_local: local,
    eicar_present: lambda?.eicar_present === true,
    cspm_misconfigurations: [
      {
        id: "public-s3",
        finding: "Public S3 bucket with synthetic customer export",
        severity: "Critical",
        active: aws,
        trigger: "Terraform (always deployed)",
      },
      {
        id: "iam-wildcard",
        finding: "ECS task role: s3:*, iam:*, secretsmanager:* on *",
        severity: "Critical",
        active: aws,
        trigger: "Terraform (always deployed)",
      },
      {
        id: "ssh-sg",
        finding: "SSH (22) open to 0.0.0.0/0 on ECS security group",
        severity: "High",
        active: aws,
        trigger: "Terraform (always deployed)",
      },
      {
        id: "public-api-gateway",
        finding:
          "Public API Gateway execute-api URL with no authorizer, no API key, and CORS *",
        severity: "Critical",
        active: orderWebhookConfigured && aws,
        trigger: "Terraform (always deployed)",
      },
      {
        id: "lambda-overprivileged",
        finding: "Lambda execution role: s3:*, iam:*, secretsmanager:* on *",
        severity: "Critical",
        active: orderWebhookConfigured && aws,
        trigger: "Terraform (always deployed)",
      },
      {
        id: "lambda-eicar",
        finding: "Order webhook Lambda package contains EICAR test string",
        severity: "Medium",
        active: orderWebhookConfigured && lambda?.eicar_present === true,
        trigger: "Lambda deployment package",
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
        role: "jays-surf-shop-demo-ecs-task",
        finding: "demo-overprivileged policy attached",
        details: "s3:*, secretsmanager:*, iam:* on Resource *",
        severity: "Critical",
        active: aws,
        trigger: "Terraform (always deployed)",
      },
      {
        role: "jays-surf-shop-demo-order-webhook",
        finding: "lambda-demo-overprivileged policy attached",
        details: "s3:*, secretsmanager:*, iam:* on Resource *",
        severity: "Critical",
        active: orderWebhookConfigured && aws,
        trigger: "Terraform (always deployed)",
      },
    ],
    attack_surface_public: attackSurfacePublic,
  };
}

export async function GET() {
  let demo: DemoStatus = {};
  try {
    const res = await proxyChat("/demo/exploit/status");
    if (res.ok) demo = await res.json();
  } catch {
    /* chat-rag unreachable */
  }

  let lambda: OrderWebhookStatus | null = null;
  const orderWebhookConfigured = Boolean(ORDER_WEBHOOK_URL);
  if (orderWebhookConfigured) {
    try {
      const res = await proxyOrderWebhook("/status");
      if (res.ok) lambda = await res.json();
    } catch {
      /* lambda unreachable */
    }
  }

  const findings = buildFindings(BASE.environment, demo, lambda, orderWebhookConfigured);

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      event_type: "security_posture_check",
      service: "frontend",
      environment: BASE.environment,
      exploit_lab: true,
      lambda_enabled: findings.lambda_enabled,
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
      aws_runtime: findings.aws_runtime,
      lambda_enabled: findings.lambda_enabled,
      is_local: findings.is_local,
      eicar_present: findings.eicar_present,
      cspm_misconfigurations: findings.cspm_misconfigurations,
      active_cves: findings.active_cves,
      iam_misconfigurations: findings.iam_misconfigurations,
    },
  });
}
