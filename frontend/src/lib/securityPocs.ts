export type PocCategory = "container" | "serverless" | "cloud-xdr" | "ai";

export interface PocStory {
  id: string;
  category: PocCategory;
  /** Attack-chain slot (1 or 2) — keep chains on different workloads when possible. */
  storyIndex: 1 | 2;
  /** Workload this chain targets (chat-rag vs frontend, etc.). */
  targetResource: string;
  title: string;
  blurb: string;
  /** Plain-language explanation of what the chain does under the hood. */
  underTheHood: string;
  lookFor: string;
  /** Seconds between automated steps (helps tools space events). */
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
    label: "Chain 1 · chat-rag",
    blurb:
      "RCE → tooling on the chat-rag container: traversal, CVE RCE, shell/downloaders, secrets, crypto sim, pip, bundled recipe.",
  },
  {
    id: "serverless",
    label: "Chain 2 · frontend / serverless",
    blurb:
      "React2Shell on frontend plus the order-webhook serverless kill chain (separate hosts from Chain 1).",
  },
  {
    id: "cloud-xdr",
    label: "Extras · Cloud identity",
    blurb:
      "Post-compromise identity and data-plane abuse (credentials, buckets, secrets) after a container chain.",
  },
  {
    id: "ai",
    label: "Extras · AI",
    blurb:
      "Unauthenticated AI endpoints and vulnerable AI packages — good for SCA and egress signals.",
  },
];


export const SECURITY_POCS: SecurityPoc[] = [
  // Cloud XDR — identity-first attack paths
  {
    id: "sa-impersonation",
    category: "cloud-xdr",
    cve: "T1550 / T1078",
    title: "Service account impersonation",
    method: "POST",
    apiPath: "/api/security/demo/runtime/sa-impersonation",
    gcpOnly: true,
    signals: [
      "iamcredentials GenerateAccessToken",
      "Cloud Audit Logs identity",
      "GCP credentials access",
    ],
    description:
      "Compromised dev SA key impersonates production SA via GenerateAccessToken — no key theft required.",
    outcome:
      "Lists Secret Manager secrets as production — detect iamcredentials.googleapis.com in audit logs.",
  },
  {
    id: "sa-key-theft",
    category: "cloud-xdr",
    cve: "T1552",
    title: "Service account key theft",
    method: "POST",
    apiPath: "/api/security/demo/runtime/sa-key-theft",
    gcpOnly: true,
    signals: ["Dormant key usage", "GCP credentials access"],
    description:
      "Uses a long-lived dev SA JSON key leaked in the container image / CI artifact (classic misconfiguration).",
    outcome:
      "Authenticates as dev SA — persistent access until key revoked; unlike metadata tokens.",
  },
  {
    id: "vm-sa-escalation",
    category: "cloud-xdr",
    cve: "T1078",
    title: "VM + actAs indirect escalation",
    method: "POST",
    apiPath: "/api/security/demo/runtime/vm-sa-escalation",
    gcpOnly: true,
    signals: ["Cloud Audit Logs compute", "Identity graph / attack path"],
    description:
      "Dev SA has compute.instances.create + iam.serviceAccounts.actAs — can launch VM with production SA attached.",
    outcome:
      "Confirms permission chain for CNAPP graph demo (no real VM created).",
  },
  {
    id: "iam-role-abuse",
    category: "cloud-xdr",
    cve: "T1078",
    title: "Post-compromise data access",
    method: "POST",
    apiPath: "/api/security/demo/iam-abuse",
    gcpOnly: true,
    signals: ["Cloud Audit Logs storage", "Secret Manager access"],
    description:
      "After metadata token theft, abuses overprivileged runtime SA — list GCS buckets, secrets, and IAM.",
    outcome: "Cloud Audit Log entries for data-plane enumeration from the workload.",
  },
  {
    id: "gcs-exfil",
    category: "cloud-xdr",
    cve: "CWE-200",
    title: "GCS data exfiltration",
    method: "POST",
    apiPath: "/api/security/demo/runtime/gcs-exfil",
    gcpOnly: true,
    signals: ["Cloud Audit Logs storage APIs", "Service account abuse chain"],
    description:
      "Enumerates GCS buckets and probes objects using stolen/impersonated credentials.",
    outcome: "Lists workshop buckets and samples the public demo export.",
  },
  // Container Runtime
  {
    id: "metadata-creds",
    category: "container",
    cve: "T1552.005",
    title: "Metadata server token theft",
    method: "POST",
    apiPath: "/api/security/demo/runtime/metadata-creds",
    gcpOnly: true,
    signals: ["GCP credentials access", "Metadata server access", "Lookup IP Services DNS"],
    description:
      "Overprivileged GKE SA — curl metadata.google.internal for OAuth token (most common workload identity risk).",
    outcome:
      "Redacted access token + metadata curl + IP lookup DNS/curl — run after Pillow RCE.",
  },

  {
    id: "react2shell",
    category: "container",
    cve: "CVE-2025-55182",
    title: "React2Shell → process toolkit",
    method: "POST",
    apiPath: "/api/security/demo/react2shell",
    signals: [
      "Operating system utilities processes",
      "Shell Process Redirect",
      "Crypto mining threats",
      "Sensitive file access",
    ],
    description:
      "React2Shell (CVE-2025-55182 / CVE-2025-66478) on Next.js App Router — runs the post-RCE toolkit inside the frontend Node process (id, shell pipe, renamed downloader, sensitive cat, miner).",
    outcome:
      "Process activity from the frontend container. SCA should flag next@15.1.0 / react@19.0.0. Follow with identity chains if you want cloud API noise.",
  },
  {
    id: "pillow-rce",
    category: "container",
    cve: "CVE-2023-50447",
    title: "CVE-named id redirect (Pillow RCE)",
    method: "POST",
    apiPath: "/api/security/demo/pillow",
    requiresPillow: true,
    signals: [
      "Operating system utilities processes",
      "Shell Process Redirect",
      "Out Of Baseline",
    ],
    description: "Exploits Pillow 10.0.1 ImageMath.eval for container-local code execution.",
    outcome: "Runs `id -a` after RCE — sensor/tracer-friendly Process events on GKE/Cloud Run.",
  },
  {
    id: "shell-pipe",
    category: "container",
    cve: "CWE-78",
    title: "Shell pipe / tee redirect",
    method: "POST",
    apiPath: "/api/security/demo/runtime/shell-pipe",
    signals: [
      "Interactive shell process stream redirected to a pipe",
      "Shell Process Redirect",
      "Operating system utilities processes",
    ],
    description: "Runs real `id` + `tee` binaries, then `sh -i` with stdio on pipes.",
    outcome: "Strong syscall signal on GKE sensor; discrete Process events on Cloud Run tracer.",
  },
  {
    id: "cve-probe-story",
    category: "container",
    cve: "CVE-2023-50447",
    title: "CVE exploitation probing (full recipe)",
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
      "One-click chat-rag sequence: Pillow CVE id file, shell pipe/tee, exec -a xmrig + mining DNS, pip list.",
    outcome:
      "Process + network activity typical of CVE probing and post-exploit tooling.",
  },
  {
    id: "cryptominer-sim",
    category: "container",
    cve: "CWE-400",
    title: "Cryptocurrency mining process",
    method: "POST",
    apiPath: "/api/security/demo/runtime/cryptominer-sim",
    signals: ["Crypto mining threats", "CryptoMiners Services DNS"],
    description:
      "Harmless simulation: cp/chmod/run `/tmp/xmrig` + DNS lookups for known mining pools.",
    outcome: "cp/chmod/xmrig exec chain + pool DNS lookups — discrete Process events.",
  },
  {
    id: "curl-pipe-sh",
    category: "container",
    cve: "T1059 / T1105",
    title: "Suspicious file download (curl | sh)",
    method: "POST",
    apiPath: "/api/security/demo/runtime/curl-pipe-sh",
    signals: ["Operating system utilities processes", "Out Of Baseline"],
    description:
      "Runs `curl -fsSL file:///tmp/jss-supply-chain.sh | sh` against a harmless local script.",
    outcome: "Real `sh` + `curl` exec chain with pipe-shaped argv and `/tmp` marker output.",
  },
  {
    id: "renamed-downloader",
    category: "container",
    cve: "T1036 / T1105",
    title: "Renamed downloader (process masquerade)",
    method: "POST",
    apiPath: "/api/security/demo/runtime/renamed-downloader",
    signals: ["Operating system utilities processes", "Out Of Baseline"],
    description:
      "Copies `curl` to `/tmp/.wget`, chmods it, then executes the hidden-path downloader.",
    outcome: "cp/chmod/run chain from `/tmp/.wget` — tracer/sensor-friendly process drift signal.",
  },
  {
    id: "package-manager",
    category: "container",
    cve: "CWE-494",
    title: "Package manager enumeration",
    method: "POST",
    apiPath: "/api/security/demo/runtime/package-manager",
    signals: ["Package Managers Processes", "Drift"],
    description: "Runs `pip install pytz` inside the running chat-rag container.",
    outcome: "Package manager install process — Package Managers Processes built-in.",
  },
  {
    id: "sensitive-file-cat",
    category: "container",
    cve: "T1005",
    title: "Private key or password search",
    method: "POST",
    apiPath: "/api/security/demo/runtime/sensitive-file-cat",
    signals: [
      "Sensitive file access",
      "Sensitive System File Access",
      "System Information File Access",
      "Operating system utilities processes",
    ],
    description:
      "Runs discrete `cat` processes against `/etc/passwd`, `/etc/hosts`, and `/proc/*` files.",
    outcome: "Explicit Process/File events for sensitive file reads without relying on Python IO.",
  },
  {
    id: "path-traversal",
    category: "container",
    cve: "CVE-2021-41773",
    title: "Sensitive file access (path traversal)",
    method: "GET",
    apiPath: "/api/security/demo/traversal",
    signals: [
      "Sensitive file access",
      "Sensitive System File Access",
      "System Information File Access",
      "Operating system utilities processes",
    ],
    description:
      "Legacy download reads `../confidential/api-credentials.txt`, then cats `/etc/passwd` and `/proc/cpuinfo`.",
    outcome: "Traversal plus discrete cat on system paths for file/process built-ins.",
  },
  {
    id: "shell-pipe-cloudrun",
    category: "serverless",
    cve: "T1059",
    title: "Shell pipe redirect (Cloud Run)",
    method: "POST",
    apiPath: "/api/security/demo/shell-pipe",
    functionOnly: true,
    signals: ["Shell Process Redirect", "Custom Process rules"],
    description:
      "Spawns `sh -c 'id | tee /tmp/jss-cloudrun-shell.txt'` in order-webhook Cloud Run.",
    outcome: "Tracer Process event with workshop marker for custom Sensor-style rules on serverless.",
  },
  {
    id: "order-yaml-checkout",
    category: "serverless",
    cve: "CVE-2020-14343",
    title: "Serverless tracer kill chain (checkout)",
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
      "One poisoned POST /checkout on Cloud Run runs the full MITRE tracer chain: T1190 → T1203 PyYAML → T1059 shell/id → T1027 renamed curl → T1005 sensitive cat → T1552 metadata token → T1619 GCS list → T1496 miner → T1565 EICAR.",
    outcome:
      "10-step securityDemo.chain with mitre_attack map. Tracer Process/File/API/DNS on Cloud Run; Cloud Audit Logs for GCS.",
  },
  // AI
  {
    id: "ai-chat-unauth",
    category: "ai",
    cve: "CWE-306",
    title: "Unauthenticated AI chat",
    method: "POST",
    apiPath: "/api/security/demo/ai-chat",
    signals: ["Communication to External AI Service", "AI SPM"],
    description:
      "Sends a prompt-injection style request through unauthenticated /api/chat → OpenAI.",
    outcome: "AI inference audit logs in Cloud Logging — AI SPM without user identity.",
  },
  {
    id: "unauth-reindex",
    category: "ai",
    cve: "CWE-306",
    title: "Unauth RAG reindex",
    method: "POST",
    apiPath: "/api/security/demo/reindex",
    signals: ["AI admin action", "Unauthorized API"],
    description: "Wipes and rebuilds the RAG knowledge base with no authentication.",
    outcome: "Unauthorized admin on AI data plane — rebuilds embeddings via OpenAI.",
  },
  {
    id: "langchain-ai",
    category: "ai",
    cve: "CVE-2024-5998",
    title: "LangChain / Chroma AI supply chain",
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
      "Pinned langchain-community (CVE-2024-5998 FAISS pickle) + chromadb 0.5.x (CVE-2026-45831). Runs post-compromise tooling in chat-rag — no pickle gadget shipped.",
    outcome:
      "Package CVEs on chat-rag plus process activity (id redirect, tee, pip list, xmrig) from the AI workload.",
  },
];

export const POC_STORIES: PocStory[] = [
  {
    id: "story-1-cve-probing",
    category: "container",
    storyIndex: 1,
    targetResource: "chat-rag",
    title: "Chain 1 — CVE exploitation probing",
    blurb:
      "Full post-exploit toolkit on chat-rag (~8s gaps): traversal → RCE → shell/downloaders → secrets cat → miner → pip → bundled recipe.",
    underTheHood:
      "Path traversal, Pillow RCE, shell pipe, curl|sh, renamed downloader, sensitive cat, xmrig sim, pip, then the one-shot CVE-probing bundle.",
    lookFor:
      "Process · shell redirect · renamed binary · sensitive files · crypto DNS · package manager on chat-rag",
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
  },
  {
    id: "story-2-frontend-rce",
    category: "serverless",
    storyIndex: 2,
    targetResource: "frontend + order-webhook",
    title: "Chain 2 — Frontend RCE + serverless kill chain",
    blurb:
      "React2Shell on the frontend, Cloud Run shell-pipe, then the order-webhook YAML / MITRE kill chain.",
    underTheHood:
      "Frontend Node post-RCE toolkit, Cloud Run process redirect, then poisoned checkout → PyYAML chain on the order webhook.",
    lookFor:
      "Process on frontend · Cloud Run shell · serverless API · unsafe YAML deserialize",
    stepGapSeconds: 8,
    pocIds: ["react2shell", "shell-pipe-cloudrun", "order-yaml-checkout"],
  },
  {
    id: "identity-to-data",
    category: "cloud-xdr",
    storyIndex: 2,
    targetResource: "chat-rag + cloud APIs",
    title: "Follow-on — Workload identity → GCS",
    blurb:
      "Full identity kit after Chain 1: metadata token, SA key theft, impersonation, VM actAs, IAM abuse, GCS exfil.",
    underTheHood:
      "Metadata server token → stolen SA key → impersonation → VM actAs escalation → Storage probes → GCS list/get.",
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
    storyIndex: 2,
    targetResource: "chat-rag",
    title: "Extra — Unauthenticated AI abuse",
    blurb:
      "Unauth AI chat + RAG reindex + LangChain/Chroma supply-chain toolkit on chat-rag.",
    underTheHood:
      "POST /api/chat, /reindex, then langchain-community / chromadb CVE-shaped tooling.",
    lookFor: "External AI egress · unauthenticated admin API · AI package CVEs · process toolkit",
    stepGapSeconds: 8,
    pocIds: ["ai-chat-unauth", "unauth-reindex", "langchain-ai"],
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
