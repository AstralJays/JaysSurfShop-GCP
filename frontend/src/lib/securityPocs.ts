export type PocCategory = "cloud-xdr" | "container-runtime" | "malware" | "ai";

export interface SecurityPoc {
  id: string;
  category: PocCategory;
  cve: string;
  title: string;
  method: "POST" | "GET";
  apiPath: string;
  description: string;
  outcome: string;
  upwindPolicies: string[];
  requiresPillow?: boolean;
  awsOnly?: boolean;
  lambdaOnly?: boolean;
}

export const POC_CATEGORIES: Array<{
  id: PocCategory;
  label: string;
  blurb: string;
}> = [
  {
    id: "cloud-xdr",
    label: "Cloud XDR",
    blurb: "Identity abuse, CloudTrail, and data exfiltration via AWS APIs after compromise.",
  },
  {
    id: "container-runtime",
    label: "Container Runtime",
    blurb: "Process, syscall, file, and network signals from ECS/Fargate workloads.",
  },
  {
    id: "malware",
    label: "Malware",
    blurb: "EICAR and vulnerable serverless artifacts — scanner and runtime malware policies.",
  },
  {
    id: "ai",
    label: "AI",
    blurb: "Unauthenticated AI admin actions and prompt abuse — AI SPM audit trail.",
  },
];

export const SECURITY_POCS: SecurityPoc[] = [
  // Cloud XDR
  {
    id: "iam-role-abuse",
    category: "cloud-xdr",
    cve: "CWE-269",
    title: "IAM role abuse",
    method: "POST",
    apiPath: "/api/security/demo/iam-abuse",
    awsOnly: true,
    upwindPolicies: ["CloudTrail / identity", "AWS credentials access"],
    description:
      "Abuses the overprivileged ECS task role from chat-rag — ListBuckets, ListRoles, ListSecrets.",
    outcome: "Real CloudTrail events for Cloud XDR correlation after container compromise.",
  },
  {
    id: "s3-exfil",
    category: "cloud-xdr",
    cve: "CWE-200",
    title: "S3 data exfiltration",
    method: "POST",
    apiPath: "/api/security/demo/runtime/s3-exfil",
    awsOnly: true,
    upwindPolicies: ["CloudTrail S3 APIs", "IAM role abuse chain"],
    description:
      "Enumerates S3 buckets and probes objects using the task role — post-compromise data theft.",
    outcome: "Lists workshop buckets and samples a public demo object via IAM.",
  },
  // Container Runtime
  {
    id: "pillow-rce",
    category: "container-runtime",
    cve: "CVE-2023-50447",
    title: "Pillow RCE",
    method: "POST",
    apiPath: "/api/security/demo/pillow",
    requiresPillow: true,
    upwindPolicies: [
      "Operating system utilities processes",
      "Shell Process Redirect",
      "Out Of Baseline",
    ],
    description: "Exploits Pillow 10.0.1 ImageMath.eval for container-local code execution.",
    outcome: "Runs `sh -c id > /tmp/jss-cve-2023-50447-id.txt` — your Upwind detection.",
  },
  {
    id: "shell-pipe",
    category: "container-runtime",
    cve: "CWE-78",
    title: "Shell pipe redirect",
    method: "POST",
    apiPath: "/api/security/demo/runtime/shell-pipe",
    upwindPolicies: ["Shell Process Redirect", "Operating system utilities processes"],
    description: "Spawns `sh` with `id | tee` — pipe redirect from an app container.",
    outcome: "Triggers syscall/process policies distinct from Pillow CVE chain.",
  },
  {
    id: "cryptominer-sim",
    category: "container-runtime",
    cve: "CWE-400",
    title: "Crypto miner simulation",
    method: "POST",
    apiPath: "/api/security/demo/runtime/cryptominer-sim",
    upwindPolicies: ["Crypto mining threats", "CryptoMiners Services DNS"],
    description:
      "Harmless simulation: process renamed to `xmrig` + DNS lookups for known mining pools.",
    outcome: "No real mining — signals for cryptominer process and pool DNS policies.",
  },
  {
    id: "package-manager",
    category: "container-runtime",
    cve: "CWE-494",
    title: "Package manager in container",
    method: "POST",
    apiPath: "/api/security/demo/runtime/package-manager",
    upwindPolicies: ["Package Managers Processes", "Drift"],
    description: "Runs `pip list` inside the running chat-rag container.",
    outcome: "Runtime drift / supply-chain policy signal from live workload.",
  },
  {
    id: "path-traversal",
    category: "container-runtime",
    cve: "CVE-2021-41773",
    title: "Path traversal",
    method: "GET",
    apiPath: "/api/security/demo/traversal",
    upwindPolicies: ["Sensitive file access", "Sensitive System File Access"],
    description: "Legacy download handler reads `../confidential/api-credentials.txt`.",
    outcome: "Returns synthetic API keys — file access outside intended directory.",
  },
  {
    id: "metadata-creds",
    category: "container-runtime",
    cve: "CWE-918",
    title: "Fargate metadata / AWS creds",
    method: "POST",
    apiPath: "/api/security/demo/runtime/metadata-creds",
    awsOnly: true,
    upwindPolicies: ["AWS credentials access", "Metadata DNS rebind"],
    description:
      "Curls 169.254.170.2 for ECS task metadata and temporary IAM credentials (Fargate IMDS analogue).",
    outcome: "Redacted creds + task ARN — run after Pillow, before IAM abuse in Cloud XDR tab.",
  },
  // Malware
  {
    id: "eicar-file",
    category: "malware",
    cve: "EICAR",
    title: "EICAR file write (container)",
    method: "POST",
    apiPath: "/api/security/demo/runtime/eicar-file",
    upwindPolicies: ["Malware protection"],
    description: "Writes the EICAR test string to `/tmp/eicar.com` inside chat-rag.",
    outcome: "Container malware protection policy signal (distinct from Lambda EICAR).",
  },
  {
    id: "eicar",
    category: "malware",
    cve: "EICAR",
    title: "EICAR response (Lambda)",
    method: "GET",
    apiPath: "/api/security/demo/eicar",
    lambdaOnly: true,
    upwindPolicies: ["Malware protection (Cloud Scanner)"],
    description: "Order webhook Lambda returns embedded EICAR from deployment package.",
    outcome: "Serverless malware / artifact scanning demo via API Gateway.",
  },
  {
    id: "yaml-deser",
    category: "malware",
    cve: "CVE-2020-14343",
    title: "PyYAML deserialization (Lambda)",
    method: "POST",
    apiPath: "/api/security/demo/yaml",
    lambdaOnly: true,
    upwindPolicies: ["Serverless SCA + runtime"],
    description: "Unsafe yaml.load() on attacker input in order-webhook Lambda.",
    outcome: "Proves serverless CVE exploitable at runtime.",
  },
  // AI
  {
    id: "ai-chat-unauth",
    category: "ai",
    cve: "CWE-306",
    title: "Unauthenticated AI chat",
    method: "POST",
    apiPath: "/api/security/demo/ai-chat",
    upwindPolicies: ["Communication to External AI Service", "AI SPM"],
    description:
      "Sends a prompt-injection style request through unauthenticated /api/chat → OpenAI.",
    outcome: "AI inference audit logs in CloudWatch — AI SPM without user identity.",
  },
  {
    id: "unauth-reindex",
    category: "ai",
    cve: "CWE-306",
    title: "Unauth RAG reindex",
    method: "POST",
    apiPath: "/api/security/demo/reindex",
    upwindPolicies: ["AI admin action", "Unauthorized API"],
    description: "Wipes and rebuilds the RAG knowledge base with no authentication.",
    outcome: "Unauthorized admin on AI data plane — rebuilds embeddings via OpenAI.",
  },
];

export function isPocBlocked(
  poc: SecurityPoc,
  findings: {
    active_cves: Array<{ cve: string }>;
    aws_runtime: boolean;
    lambda_enabled: boolean;
  }
): boolean {
  if (poc.requiresPillow && findings.active_cves.every((c) => !c.cve.includes("50447"))) {
    return true;
  }
  if (poc.awsOnly && !findings.aws_runtime) return true;
  if (poc.lambdaOnly && !findings.lambda_enabled) return true;
  return false;
}
