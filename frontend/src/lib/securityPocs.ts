export type PocCategory = "container" | "serverless" | "cloud-xdr" | "ai";

export interface PocStory {
  id: string;
  category: PocCategory;
  title: string;
  /** Short attacker-facing summary — what this chain does. */
  blurb: string;
  /** Plain explanation of what runs under the hood (no product jargon). */
  underTheHood: string;
  /** Optional tip for where to look in the monitoring console. */
  detectionTip: string;
  pocIds: string[];
  continueIn?: { tab: PocCategory; storyId: string; label: string };
}
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
  upwindPolicies: string[];
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
    blurb:
      "Attack chains on GKE frontend + chat-rag: initial access, eBPF toolkit, then metadata pivot.",
  },
  {
    id: "serverless",
    label: "Serverless",
    blurb:
      "Attack chain on order-webhook Cloud Run — PyYAML MITRE checkout with tracer Process/File/API/DNS.",
  },
  {
    id: "cloud-xdr",
    label: "Cloud XDR",
    blurb:
      "Continue after compromise — runtime SA data access or leaked SA key → impersonation → GCS.",
  },
  {
    id: "ai",
    label: "AI",
    blurb: "Unauthenticated AI admin actions, prompt abuse, and AI package supply-chain harnesses.",
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
    upwindPolicies: [
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
    upwindPolicies: ["Dormant key usage", "GCP credentials access"],
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
    upwindPolicies: ["Cloud Audit Logs compute", "Identity graph / attack path"],
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
    upwindPolicies: ["Cloud Audit Logs storage", "Secret Manager access"],
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
    upwindPolicies: ["Cloud Audit Logs storage APIs", "Service account abuse chain"],
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
    upwindPolicies: ["GCP credentials access", "Metadata server access", "Lookup IP Services DNS"],
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
    upwindPolicies: [
      "Operating system utilities processes",
      "Shell Process Redirect",
      "Crypto mining threats",
      "Sensitive file access",
    ],
    description:
      "React2Shell (CVE-2025-55182 / CVE-2025-66478) on Next.js App Router — workshop harness runs the post-RCE toolkit inside the frontend Node process (id, shell pipe, renamed downloader, sensitive cat, miner).",
    outcome:
      "Process events from the frontend container. SCA shows Critical on next@15.1.0 / react@19.0.0. Continue with metadata → Cloud XDR.",
  },
  {
    id: "pillow-rce",
    category: "container",
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
    outcome: "Runs `id -a` after RCE — sensor/tracer-friendly Process events on GKE/Cloud Run.",
  },
  {
    id: "shell-pipe",
    category: "container",
    cve: "CWE-78",
    title: "Shell pipe redirect",
    method: "POST",
    apiPath: "/api/security/demo/runtime/shell-pipe",
    upwindPolicies: [
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
    title: "CVE probe → Threat Story bait",
    method: "POST",
    apiPath: "/api/security/demo/runtime/cve-probe-story",
    requiresPillow: false,
    upwindPolicies: [
      "Suspicious CVE Exploitation Probing",
      "Crypto mining threats",
      "Shell Process Redirect",
      "Package Managers Processes",
      "Drift",
    ],
    description:
      "One-click replay of the Jul-7 Threat Story sequence on chat-rag: CVE-named id redirect, shell pipe, exec -a xmrig, pip list, renamed miner. Detections first; Story may lag minutes.",
    outcome:
      "Same Process cluster as ‘Suspicious CVE Exploitation Probing in Container’ — best on GKE sensor, then ECS/ACA tracer.",
  },
  {
    id: "cryptominer-sim",
    category: "container",
    cve: "CWE-400",
    title: "Crypto miner simulation",
    method: "POST",
    apiPath: "/api/security/demo/runtime/cryptominer-sim",
    upwindPolicies: ["Crypto mining threats", "CryptoMiners Services DNS"],
    description:
      "Harmless simulation: cp/chmod/run `/tmp/xmrig` + DNS lookups for known mining pools.",
    outcome: "cp/chmod/xmrig exec chain + pool DNS lookups — discrete Process events.",
  },
  {
    id: "curl-pipe-sh",
    category: "container",
    cve: "T1059 / T1105",
    title: "curl | sh supply chain",
    method: "POST",
    apiPath: "/api/security/demo/runtime/curl-pipe-sh",
    upwindPolicies: ["Operating system utilities processes", "Out Of Baseline"],
    description:
      "Runs `curl -fsSL file:///tmp/jss-supply-chain.sh | sh` against a harmless local script.",
    outcome: "Real `sh` + `curl` exec chain with pipe-shaped argv and `/tmp` marker output.",
  },
  {
    id: "renamed-downloader",
    category: "container",
    cve: "T1036 / T1105",
    title: "Renamed downloader",
    method: "POST",
    apiPath: "/api/security/demo/runtime/renamed-downloader",
    upwindPolicies: ["Operating system utilities processes", "Out Of Baseline"],
    description:
      "Copies `curl` to `/tmp/.wget`, chmods it, then executes the hidden-path downloader.",
    outcome: "cp/chmod/run chain from `/tmp/.wget` — tracer/sensor-friendly process drift signal.",
  },
  {
    id: "package-manager",
    category: "container",
    cve: "CWE-494",
    title: "Package manager in container",
    method: "POST",
    apiPath: "/api/security/demo/runtime/package-manager",
    upwindPolicies: ["Package Managers Processes", "Drift"],
    description: "Runs `pip install pytz` inside the running chat-rag container.",
    outcome: "Package manager install process — Package Managers Processes built-in.",
  },
  {
    id: "sensitive-file-cat",
    category: "container",
    cve: "T1005",
    title: "Sensitive file via cat",
    method: "POST",
    apiPath: "/api/security/demo/runtime/sensitive-file-cat",
    upwindPolicies: [
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
    title: "Path traversal",
    method: "GET",
    apiPath: "/api/security/demo/traversal",
    upwindPolicies: [
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
    upwindPolicies: ["Shell Process Redirect", "Custom Process rules"],
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
    upwindPolicies: [
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
    upwindPolicies: ["Communication to External AI Service", "AI SPM"],
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
    upwindPolicies: ["AI admin action", "Unauthorized API"],
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
    upwindPolicies: [
      "AI SPM / vulnerable AI packages",
      "Operating system utilities processes",
      "Shell Process Redirect",
      "Package Managers Processes",
      "Crypto mining threats",
    ],
    description:
      "Pinned langchain-community (CVE-2024-5998 FAISS pickle) + chromadb 0.5.x (CVE-2026-45831). Workshop harness runs post-deserialize toolkit in chat-rag — no pickle gadget shipped.",
    outcome:
      "SCA Criticals on chat-rag plus Process events (id redirect, tee, pip list, xmrig) from the AI workload.",
  },
];

export const POC_STORIES: PocStory[] = [
  {
    id: "cve-probing-story",
    category: "container",
    title: "Chain 0 — CVE probe process cluster",
    blurb:
      "On chat-rag, run a tight burst of suspicious processes that look like post-CVE exploitation.",
    underTheHood:
      "One API call makes chat-rag spawn real binaries in order: write a CVE-looking id output file, open a shell with piped stdio, start a short-lived process named like xmrig, then run pip. Nothing is remotely exploited — the app intentionally executes that process tree inside the container. On GKE this is the strongest place to see a correlated cluster.",
    detectionTip:
      "Correlated process/drift/crypto signals on a single GKE workload — may show as a Threat Story after clustering catches up.",
    pocIds: ["cve-probe-story"],
  },
  {
    id: "react2shell-pivot",
    category: "container",
    title: "Chain 1 — React2Shell to cloud pivot",
    blurb:
      "RCE on the public Next.js frontend, run a post-exploit toolkit, then steal a runtime SA token from metadata.",
    underTheHood:
      "Step 1 hits a controlled React2Shell harness on the frontend (pinned vulnerable Next/React). Inside the Node process it runs id, shell redirect, a renamed binary, sensitive file reads, and a miner-shaped process. Step 2 queries GCE metadata for a service-account access token — the cloud pivot used by the next chain.",
    detectionTip: "Process activity on the frontend pod, then metadata/token access.",
    pocIds: ["react2shell", "metadata-creds"],
    continueIn: {
      tab: "cloud-xdr",
      storyId: "identity-to-data",
      label: "Continue in Cloud XDR → Chain 1 (Runtime SA to GCS exfiltration)",
    },
  },
  {
    id: "container-compromise",
    category: "container",
    title: "Chain 2 — Pillow RCE to host recon",
    blurb:
      "Different entry point on chat-rag: Pillow code execution, path traversal, secret file reads, then metadata.",
    underTheHood:
      "chat-rag loads vulnerable Pillow and evaluates ImageMath to get code execution in the Python process. Next it reads off-path files and cats sensitive paths, then hits metadata for an SA token. Same ending as Chain 1 (cloud identity), different service and CVE.",
    detectionTip: "Process + sensitive-file activity on chat-rag, then credential/metadata access.",
    pocIds: ["pillow-rce", "path-traversal", "sensitive-file-cat", "metadata-creds"],
    continueIn: {
      tab: "cloud-xdr",
      storyId: "identity-to-data",
      label: "Continue in Cloud XDR → Chain 1",
    },
  },
  {
    id: "post-exploit-toolkit",
    category: "container",
    title: "Chain 3 — Attacker toolkit & impact",
    blurb:
      "Assume the box is already owned — curl|sh, spoofed binary, fake miner, package manager, shell redirect.",
    underTheHood:
      "These steps do not exploit a CVE. Each one runs a concrete post-compromise behavior on GKE: pipe a download into a shell, exec under a fake argv0, run a short xmrig-named process, invoke a package manager, and redirect interactive shell stdio. Strongest MITRE execution → evasion → impact walkthrough.",
    detectionTip: "Crypto-mining and correlated process signals on the GKE sensor are usually loudest.",
    pocIds: [
      "curl-pipe-sh",
      "renamed-downloader",
      "cryptominer-sim",
      "package-manager",
      "shell-pipe",
    ],
  },
  {
    id: "serverless-checkout-chain",
    category: "serverless",
    title: "Chain 1 — Poisoned checkout (Cloud Run)",
    blurb:
      "Public checkout accepts malicious YAML → code execution shape → metadata token / GCS → fake miner + EICAR.",
    underTheHood:
      "Cloud Run order-webhook unsafely loads YAML from the checkout body (PyYAML), then runs an intentional post-exploit sequence: local toolkit steps, metadata token use against GCS, then miner- and malware-file shaped artifacts.",
    detectionTip: "Process/File/API/DNS on Cloud Run plus Cloud Audit Logs for identity and storage.",
    pocIds: ["order-yaml-checkout"],
  },
  {
    id: "identity-to-data",
    category: "cloud-xdr",
    title: "Chain 1 — Runtime SA to GCS exfiltration",
    blurb:
      "With the runtime service-account token, abuse IAM and pull objects from GCS.",
    underTheHood:
      "No container RCE here. Using the workload’s runtime SA token, call overly permissive APIs and list/get objects from a demo export bucket — classic post-compromise data access.",
    detectionTip: "Cloud Audit Logs: storage and identity calls from the runtime SA.",
    pocIds: ["iam-role-abuse", "gcs-exfil"],
  },
  {
    id: "sa-escalation",
    category: "cloud-xdr",
    title: "Chain 2 — Dev SA key to impersonation",
    blurb:
      "Use a leaked user-managed SA key, impersonate a stronger SA, then confirm escalation and pull GCS data.",
    underTheHood:
      "Authenticates with a planted/leaked JSON key, calls iamcredentials to mint tokens for a more privileged SA, probes VM/actAs paths, then reads GCS. Long-lived key risk vs Chain 1’s ephemeral metadata token.",
    detectionTip: "Dormant key usage, GenerateAccessToken, then storage access in Audit Logs.",
    pocIds: ["sa-key-theft", "sa-impersonation", "vm-sa-escalation", "gcs-exfil"],
  },
  {
    id: "ai-data-plane",
    category: "ai",
    title: "Chain 1 — Unauthenticated AI abuse",
    blurb:
      "Abuse the open chat API, then wipe and rebuild the RAG index with no login.",
    underTheHood:
      "First call hits /api/chat with a prompt-injection style message so the backend calls OpenAI. Second call hits the unauthenticated reindex endpoint, which deletes and rebuilds embeddings. Shows missing auth on AI control/data plane — not a package CVE.",
    detectionTip: "External AI egress and unauthorized admin-style AI actions.",
    pocIds: ["ai-chat-unauth", "unauth-reindex"],
  },
  {
    id: "ai-supply-chain",
    category: "ai",
    title: "Chain 2 — AI supply-chain CVEs",
    blurb:
      "Vulnerable LangChain/Chroma packages are installed; then run post-compromise toolkit as if unsafe deserialize succeeded.",
    underTheHood:
      "chat-rag pins langchain-community (CVE-2024-5998) and chromadb (CVE-2026-45831) so scanners flag Criticals. The demo endpoint then runs the process toolkit inside that AI service — it does not ship a live pickle RCE gadget.",
    detectionTip: "Package Criticals on chat-rag plus process toolkit events from the AI workload.",
    pocIds: ["langchain-ai"],
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
