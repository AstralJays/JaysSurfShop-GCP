export type PocCategory = "container" | "serverless" | "cloud-xdr" | "ai";

export type StoryKind = "story" | "follow-on" | "extra";

export interface PocStory {
  id: string;
  category: PocCategory;
  kind: StoryKind;
  storyIndex?: 1 | 2;
  targetResource: string;
  title: string;
  blurb: string;
  underTheHood: string;
  lookFor: string;
  stepGapSeconds?: number;
  pocIds: string[];
  continueIn?: { tab: PocCategory; storyId: string; label: string };
}

export interface SecurityPoc {
  id: string;
  category: PocCategory;
  cve: string;
  title: string;
  method: "POST" | "GET";
  apiPath: string;
  description: string;
  outcome: string;
  signals: string[];
  requiresPillow?: boolean;
  gcpOnly?: boolean;
  functionOnly?: boolean;
}

export const POC_CATEGORIES: Array<{
  id: PocCategory;
  label: string;
  blurb: string;
}> = [
  {
    id: "container",
    label: "Container",
    blurb: "Stories that run inside the chat-rag workload.",
  },
  {
    id: "serverless",
    label: "Frontend & serverless",
    blurb: "Stories on the storefront and order-webhook — separate hosts from container.",
  },
  {
    id: "cloud-xdr",
    label: "Identity",
    blurb: "Steal workload credentials and abuse cloud identity to reach data.",
  },
  {
    id: "ai",
    label: "AI",
    blurb: "OWASP LLM Top 10 style attacks against the shop assistant and RAG store.",
  },
];

export const SECURITY_POCS: SecurityPoc[] = [
  {
    id: "sa-impersonation",
    category: "cloud-xdr",
    cve: "T1550 / T1078",
    title: "Impersonate a production service account",
    method: "POST",
    apiPath: "/api/security/demo/runtime/sa-impersonation",
    gcpOnly: true,
    signals: [
      "iamcredentials GenerateAccessToken",
      "Cloud Audit Logs identity",
      "GCP credentials access",
    ],
    description: "Uses GenerateAccessToken to impersonate a stronger SA from a compromised identity.",
    outcome: "iamcredentials audit trail for SA impersonation.",
  },
  {
    id: "sa-key-theft",
    category: "cloud-xdr",
    cve: "T1552",
    title: "Use a leaked service account key",
    method: "POST",
    apiPath: "/api/security/demo/runtime/sa-key-theft",
    gcpOnly: true,
    signals: ["Dormant key usage", "GCP credentials access"],
    description: "Authenticates with a long-lived SA JSON key left in the image / CI artifact.",
    outcome: "Persistent SA key use until the key is revoked.",
  },
  {
    id: "vm-sa-escalation",
    category: "cloud-xdr",
    cve: "T1078",
    title: "Show VM + actAs escalation path",
    method: "POST",
    apiPath: "/api/security/demo/runtime/vm-sa-escalation",
    gcpOnly: true,
    signals: ["Cloud Audit Logs compute", "Identity graph / attack path"],
    description: "Confirms compute.create + iam.serviceAccounts.actAs — launch a VM with a stronger SA.",
    outcome: "Permission chain for CNAPP graph demos (no real VM created).",
  },
  {
    id: "iam-role-abuse",
    category: "cloud-xdr",
    cve: "T1078",
    title: "Enumerate data with the runtime SA",
    method: "POST",
    apiPath: "/api/security/demo/iam-abuse",
    gcpOnly: true,
    signals: ["Cloud Audit Logs storage", "Secret Manager access"],
    description: "Abuses an overprivileged runtime SA — list GCS, secrets, and IAM.",
    outcome: "Cloud Audit Log enumeration from the workload SA.",
  },
  {
    id: "gcs-exfil",
    category: "cloud-xdr",
    cve: "CWE-200",
    title: "List and read GCS buckets",
    method: "POST",
    apiPath: "/api/security/demo/runtime/gcs-exfil",
    gcpOnly: true,
    signals: ["Cloud Audit Logs storage APIs", "Service account abuse chain"],
    description: "Enumerates GCS buckets and samples objects with stolen/impersonated credentials.",
    outcome: "GCS list/get — post-compromise data access.",
  },
  {
    id: "metadata-creds",
    category: "container",
    cve: "T1552.005",
    title: "Steal a token from the metadata server",
    method: "POST",
    apiPath: "/api/security/demo/runtime/metadata-creds",
    gcpOnly: true,
    signals: ["GCP credentials access", "Metadata server access", "Lookup IP Services DNS"],
    description: "Queries metadata.google.internal for an OAuth token for the workload SA.",
    outcome: "Redacted metadata token — bridge from container RCE into identity abuse.",
  },
  {
    id: "react2shell",
    category: "container",
    cve: "CVE-2025-55182",
    title: "Exploit React2Shell on the frontend",
    method: "POST",
    apiPath: "/api/security/demo/react2shell",
    signals: [
      "Operating system utilities processes",
      "Shell Process Redirect",
      "Crypto mining threats",
      "Sensitive file access",
    ],
    description:
      "Uses React2Shell (CVE-2025-55182) against Next.js App Router to run post-RCE tooling in the frontend process.",
    outcome: "Process activity (shell, downloader, sensitive reads, miner sim) from the frontend container.",
  },
  {
    id: "pillow-rce",
    category: "container",
    cve: "CVE-2023-50447",
    title: "Gain code execution via Pillow",
    method: "POST",
    apiPath: "/api/security/demo/pillow",
    requiresPillow: true,
    signals: [
      "Operating system utilities processes",
      "Shell Process Redirect",
      "Out Of Baseline",
    ],
    description: "Exploits Pillow 10.0.1 ImageMath.eval for local code execution in chat-rag.",
    outcome: "Runs a short identity probe after RCE — discrete process activity in chat-rag.",
  },
  {
    id: "shell-pipe",
    category: "container",
    cve: "CWE-78",
    title: "Redirect a shell through a pipe",
    method: "POST",
    apiPath: "/api/security/demo/runtime/shell-pipe",
    signals: [
      "Interactive shell process stream redirected to a pipe",
      "Shell Process Redirect",
      "Operating system utilities processes",
    ],
    description: "Spawns real shell utilities with stdio wired through pipes (id, tee, interactive sh).",
    outcome: "Interactive shell / pipe-shaped process patterns.",
  },
  {
    id: "cve-probe-story",
    category: "container",
    cve: "CVE-2023-50447",
    title: "One-shot post-exploit probe",
    method: "POST",
    apiPath: "/api/security/demo/runtime/cve-probe-story",
    requiresPillow: false,
    signals: [
      "Suspicious CVE Exploitation Probing",
      "Crypto mining threats",
      "Shell Process Redirect",
      "Package Managers Processes",
      "Drift",
    ],
    description:
      "Compressed replay of several post-exploit techniques in one request (handy for a single detection window).",
    outcome: "Bundled process + network activity typical of CVE probing after foothold.",
  },
  {
    id: "cryptominer-sim",
    category: "container",
    cve: "CWE-400",
    title: "Simulate a crypto miner",
    method: "POST",
    apiPath: "/api/security/demo/runtime/cryptominer-sim",
    signals: ["Crypto mining threats", "CryptoMiners Services DNS"],
    description: "Harmless simulation: drop a renamed xmrig binary and resolve known mining-pool DNS names.",
    outcome: "Miner-shaped process chain plus mining-pool DNS lookups.",
  },
  {
    id: "curl-pipe-sh",
    category: "container",
    cve: "T1059 / T1105",
    title: "Download and pipe to shell",
    method: "POST",
    apiPath: "/api/security/demo/runtime/curl-pipe-sh",
    signals: ["Operating system utilities processes", "Out Of Baseline"],
    description: "Runs curl | sh against a harmless local script (supply-chain shaped).",
    outcome: "curl + sh pipe pattern with a /tmp marker.",
  },
  {
    id: "renamed-downloader",
    category: "container",
    cve: "T1036 / T1105",
    title: "Run a renamed downloader",
    method: "POST",
    apiPath: "/api/security/demo/runtime/renamed-downloader",
    signals: ["Operating system utilities processes", "Out Of Baseline"],
    description: "Copies curl to a hidden path, then executes it under a fake name.",
    outcome: "Renamed-binary / process-masquerade signal from /tmp.",
  },
  {
    id: "package-manager",
    category: "container",
    cve: "CWE-494",
    title: "Install a package with pip",
    method: "POST",
    apiPath: "/api/security/demo/runtime/package-manager",
    signals: ["Package Managers Processes", "Drift"],
    description: "Runs pip install inside the live chat-rag container.",
    outcome: "Package-manager process activity inside a running container.",
  },
  {
    id: "sensitive-file-cat",
    category: "container",
    cve: "T1005",
    title: "Read sensitive host files",
    method: "POST",
    apiPath: "/api/security/demo/runtime/sensitive-file-cat",
    signals: [
      "Sensitive file access",
      "Sensitive System File Access",
      "System Information File Access",
      "Operating system utilities processes",
    ],
    description: "Cats /etc/passwd, /etc/hosts, and selected /proc files via discrete processes.",
    outcome: "Sensitive file-read process/file events.",
  },
  {
    id: "path-traversal",
    category: "container",
    cve: "CVE-2021-41773",
    title: "Steal files via path traversal",
    method: "GET",
    apiPath: "/api/security/demo/traversal",
    signals: [
      "Sensitive file access",
      "Sensitive System File Access",
      "System Information File Access",
      "Operating system utilities processes",
    ],
    description: "Legacy download path reads a confidential file, then probes system paths.",
    outcome: "Path traversal plus sensitive file access on chat-rag.",
  },
  {
    id: "shell-pipe-cloudrun",
    category: "serverless",
    cve: "T1059",
    title: "Redirect a shell on Cloud Run",
    method: "POST",
    apiPath: "/api/security/demo/shell-pipe",
    functionOnly: true,
    signals: ["Shell Process Redirect", "Custom Process rules"],
    description: "Spawns a shell pipe (id | tee) inside the order-webhook Cloud Run service.",
    outcome: "Serverless process / shell-redirect signal on Cloud Run.",
  },
  {
    id: "order-yaml-checkout",
    category: "serverless",
    cve: "CVE-2020-14343",
    title: "Poison checkout with unsafe YAML",
    method: "POST",
    apiPath: "/api/security/demo/order-yaml-checkout",
    functionOnly: true,
    signals: [
      "API custom rules — poisoned checkout",
      "CVE-2020-14343 / unsafe deserialization",
      "Shell Process Redirect",
      "GCP credentials access",
      "Crypto mining threats",
      "Malware protection",
      "Cloud Audit Logs storage",
    ],
    description:
      "Sends a poisoned POST /checkout to Cloud Run — unsafe YAML deserialize into a post-exploit sequence.",
    outcome: "Full serverless kill chain on the order webhook (process, identity, GCS, miner sim).",
  },
  {
    id: "ai-chat-unauth",
    category: "ai",
    cve: "LLM01:2025",
    title: "Prompt injection (unauthenticated chat)",
    method: "POST",
    apiPath: "/api/security/demo/runtime/ai-prompt-injection",
    signals: ["Communication to External AI Service", "Prompt injection", "AI SPM"],
    description:
      "OWASP LLM01 — sends a direct prompt-injection style request through the open chat API.",
    outcome: "Unauthenticated LLM call with instruction-override prompt.",
  },
  {
    id: "unauth-reindex",
    category: "ai",
    cve: "CWE-306",
    title: "Rebuild the RAG index without auth",
    method: "POST",
    apiPath: "/api/security/demo/reindex",
    signals: ["AI admin action", "Unauthorized API"],
    description: "Wipes and rebuilds the RAG knowledge base with no authentication.",
    outcome: "Unauthorized admin action on the AI data plane — picks up planted demo secrets.",
  },
  {
    id: "ai-sensitive-disclosure",
    category: "ai",
    cve: "LLM02:2025",
    title: "Disclose sensitive data via RAG",
    method: "POST",
    apiPath: "/api/security/demo/runtime/ai-sensitive-disclosure",
    signals: ["Sensitive data in RAG corpus", "PII / secret disclosure via AI"],
    description:
      "OWASP LLM02 — retrieves planted VIP emails and an internal API key from the knowledge base.",
    outcome: "Sensitive docs (and often the model reply) expose demo PII/secrets.",
  },
  {
    id: "langchain-ai",
    category: "ai",
    cve: "LLM03:2025",
    title: "Exercise vulnerable AI packages",
    method: "POST",
    apiPath: "/api/security/demo/runtime/langchain-ai",
    signals: [
      "AI SPM / vulnerable AI packages",
      "Operating system utilities processes",
      "Shell Process Redirect",
      "Package Managers Processes",
      "Crypto mining threats",
    ],
    description:
      "OWASP LLM03 supply chain — pinned langchain-community / chromadb CVEs plus light tooling on chat-rag.",
    outcome: "SCA package signals plus process activity from the AI workload.",
  },
  {
    id: "ai-poison",
    category: "ai",
    cve: "LLM04:2025",
    title: "Poison the vector store",
    method: "POST",
    apiPath: "/api/security/demo/runtime/ai-poison",
    signals: ["Unauthenticated RAG write", "Poisoned embedding retrieval"],
    description:
      "OWASP LLM04 — unauthenticated upsert of a fake FREEBOARD promo into Chroma, then retrieves it.",
    outcome: "Poisoned chunk is written and comes back from similarity search.",
  },
  {
    id: "ai-xss-output",
    category: "ai",
    cve: "LLM05:2025",
    title: "Unsafe HTML in model output",
    method: "POST",
    apiPath: "/api/security/demo/runtime/ai-xss-output",
    signals: ["HTML/JS in model output", "Client-side XSS if unsanitized"],
    description:
      "OWASP LLM05 — obtains executable HTML/JS as assistant output (falls back to a canned payload).",
    outcome: "Unsafe HTML written for a render-as-HTML XSS demo.",
  },
  {
    id: "ai-system-prompt-leak",
    category: "ai",
    cve: "LLM07:2025",
    title: "Leak the system prompt",
    method: "POST",
    apiPath: "/api/security/demo/runtime/ai-system-prompt-leak",
    signals: ["System prompt secret extraction", "Instruction leakage"],
    description:
      "OWASP LLM07 — the system prompt embeds a staff PIN / wholesale code; asks the model to repeat it.",
    outcome: "Prompt-leak attempt against system instructions that contain workshop secrets.",
  },
  {
    id: "ai-rag-embedding",
    category: "ai",
    cve: "LLM08:2025",
    title: "Abuse vector / embedding retrieval",
    method: "POST",
    apiPath: "/api/security/demo/runtime/ai-rag-embedding",
    signals: ["Insecure RAG retrieval", "No tenant/ACL on embeddings"],
    description:
      "OWASP LLM08 — similarity search returns sensitive or poisoned chunks with no access control.",
    outcome: "Vector hits on confidential and/or poisoned embeddings.",
  },
  {
    id: "ai-unbounded",
    category: "ai",
    cve: "LLM10:2025",
    title: "Burn tokens with unbounded calls",
    method: "POST",
    apiPath: "/api/security/demo/runtime/ai-unbounded",
    signals: ["Burst LLM/token spend", "No rate limit on AI API"],
    description:
      "OWASP LLM10 — fires multiple unauthenticated chat completions in one request (cost/availability).",
    outcome: "Burst of LLM calls with aggregated token counts.",
  },
];

export const POC_STORIES: PocStory[] = [
  {
    id: "story-1-cve-probing",
    category: "container",
    kind: "story",
    storyIndex: 1,
    targetResource: "chat-rag",
    title: "Post-exploit toolkit on chat-rag",
    blurb:
      "After a path-traversal / RCE foothold, runs shell, downloaders, secret reads, a miner sim, and package probing on the chat service.",
    underTheHood:
      "Traversal → Pillow RCE → shell pipe → curl|sh → renamed downloader → sensitive cat → xmrig sim → pip → optional one-shot probe.",
    lookFor: "Process, shell redirects, renamed binaries, sensitive files, mining DNS, and pip on chat-rag",
    stepGapSeconds: 8,
    pocIds: [
      "path-traversal",
      "pillow-rce",
      "shell-pipe",
      "curl-pipe-sh",
      "renamed-downloader",
      "sensitive-file-cat",
      "cryptominer-sim",
      "package-manager",
      "cve-probe-story",
    ],
    continueIn: {
      tab: "cloud-xdr",
      storyId: "identity-to-data",
      label: "Continue with identity → GCS",
    },
  },
  {
    id: "story-2-frontend-rce",
    category: "serverless",
    kind: "story",
    storyIndex: 2,
    targetResource: "frontend + order-webhook",
    title: "Frontend RCE → serverless checkout",
    blurb:
      "Exploits React2Shell on the storefront, redirects a shell on Cloud Run, then sends a poisoned order webhook.",
    underTheHood:
      "Frontend Node post-RCE toolkit, Cloud Run shell pipe, then PyYAML deserialization on the order webhook.",
    lookFor: "Process on frontend · Cloud Run shell · unsafe YAML · follow-on crypto / identity noise",
    stepGapSeconds: 8,
    pocIds: ["react2shell", "shell-pipe-cloudrun", "order-yaml-checkout"],
  },
  {
    id: "identity-to-data",
    category: "cloud-xdr",
    kind: "follow-on",
    targetResource: "chat-rag + GCP APIs",
    title: "Steal workload identity → reach GCS",
    blurb:
      "Pulls metadata tokens and SA keys, impersonates stronger identities, then lists and reads GCS.",
    underTheHood:
      "Metadata token → SA key theft → impersonation → VM actAs path → IAM abuse → GCS list/get.",
    lookFor: "Cloud Audit Logs · metadata/creds · SA impersonation · GCS APIs",
    stepGapSeconds: 8,
    pocIds: [
      "metadata-creds",
      "sa-key-theft",
      "sa-impersonation",
      "vm-sa-escalation",
      "iam-role-abuse",
      "gcs-exfil",
    ],
  },
  {
    id: "ai-data-plane",
    category: "ai",
    kind: "extra",
    targetResource: "chat-rag",
    title: "OWASP LLM Top 10 on the shop AI",
    blurb:
      "Eight LLM risks on chat-rag: prompt injection, sensitive disclosure, supply chain, data poisoning, unsafe output, system-prompt leak, vector abuse, and unbounded token spend.",
    underTheHood:
      "LLM01 injection → reindex → LLM02 SID → LLM03 packages → LLM04 poison → LLM05 XSS HTML → LLM07 prompt leak → LLM08 embeddings → LLM10 burst chat.",
    lookFor:
      "AI egress · unauth RAG write/read · secret/PII in context · package CVEs · burst token use",
    stepGapSeconds: 8,
    pocIds: [
      "ai-chat-unauth",
      "unauth-reindex",
      "ai-sensitive-disclosure",
      "langchain-ai",
      "ai-poison",
      "ai-xss-output",
      "ai-system-prompt-leak",
      "ai-rag-embedding",
      "ai-unbounded",
    ],
  },
];

export function getStoriesForCategory(category: PocCategory): PocStory[] {
  return POC_STORIES.filter((story) => story.category === category);
}

export function isPocBlocked(
  poc: SecurityPoc,
  findings: {
    active_cves: Array<{ cve: string }>;
    gcp_runtime: boolean;
    function_enabled: boolean;
  }
): boolean {
  if (poc.requiresPillow && findings.active_cves.every((c) => !c.cve.includes("50447"))) {
    return true;
  }
  if (poc.gcpOnly && !findings.gcp_runtime) return true;
  if (poc.functionOnly && !findings.function_enabled) return true;
  return false;
}
