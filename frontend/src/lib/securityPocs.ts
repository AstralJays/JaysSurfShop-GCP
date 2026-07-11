export type PocCategory = "cloud-xdr" | "container-runtime" | "ai";

export interface PocStory {
  id: string;
  category: PocCategory;
  title: string;
  blurb: string;
  upwindFocus: string;
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
    id: "cloud-xdr",
    label: "Cloud XDR",
    blurb:
      "Two identity paths after compromise — runtime SA data access or dev SA key → impersonation → GCS exfiltration.",
  },
  {
    id: "container-runtime",
    label: "Container Runtime",
    blurb:
      "Ordered stories from CVE initial access through post-exploit toolkit — run steps in sequence for correlated Upwind Stories.",
  },
  {
    id: "ai",
    label: "AI",
    blurb: "Unauthenticated AI admin actions and prompt abuse — AI SPM audit trail.",
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
    category: "container-runtime",
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
    outcome: "Runs `id -a` after RCE — sensor/tracer-friendly Process events on GKE/Cloud Run.",
  },
  {
    id: "shell-pipe",
    category: "container-runtime",
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
    id: "cryptominer-sim",
    category: "container-runtime",
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
    category: "container-runtime",
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
    category: "container-runtime",
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
    category: "container-runtime",
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
    category: "container-runtime",
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
    category: "container-runtime",
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
    category: "container-runtime",
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
];

export const POC_STORIES: PocStory[] = [
  {
    id: "container-compromise",
    category: "container-runtime",
    title: "Story 1 — CVE to cloud pivot",
    blurb:
      "Exploit Pillow RCE, harvest secrets on disk, probe host paths, then curl the metadata server for an OAuth token.",
    upwindFocus: "Process events → sensitive file reads → GCP credentials / metadata access",
    pocIds: ["pillow-rce", "path-traversal", "sensitive-file-cat", "metadata-creds"],
    continueIn: {
      tab: "cloud-xdr",
      storyId: "identity-to-data",
      label: "Continue in Cloud XDR → Story 1 (Runtime SA to GCS exfiltration)",
    },
  },
  {
    id: "post-exploit-toolkit",
    category: "container-runtime",
    title: "Story 2 — Attacker toolkit & impact",
    blurb:
      "Stage a supply-chain download, evade with a renamed binary, run crypto miner impact, install persistence tools, then syscall pipe patterns.",
    upwindFocus:
      "Crypto mining threats + CVE probing Story correlation on GKE sensor (pillow + miner + pip + shell)",
    pocIds: [
      "curl-pipe-sh",
      "renamed-downloader",
      "cryptominer-sim",
      "package-manager",
      "shell-pipe",
    ],
  },
  {
    id: "serverless-tracer",
    category: "container-runtime",
    title: "Story 3 — Serverless tracer (Cloud Run)",
    blurb:
      "Separate workload lane — order-webhook Cloud Run tracer instead of GKE chat-rag sensor.",
    upwindFocus: "Custom Process rules · tracer on Cloud Run, not node eBPF sensor",
    pocIds: ["shell-pipe-cloudrun"],
  },
  {
    id: "identity-to-data",
    category: "cloud-xdr",
    title: "Story 1 — Runtime SA to GCS exfiltration",
    blurb:
      "After metadata token theft in Container Story 1, abuse the overprivileged GKE service account and probe GCS.",
    upwindFocus: "Cloud Audit Logs storage · Secret Manager · service account abuse chain",
    pocIds: ["iam-role-abuse", "gcs-exfil"],
  },
  {
    id: "sa-escalation",
    category: "cloud-xdr",
    title: "Story 2 — Dev SA key to impersonation",
    blurb:
      "Alternate kill chain: leaked dev SA JSON key → impersonate production SA → confirm VM+actAs escalation path.",
    upwindFocus: "Dormant key usage · iamcredentials GenerateAccessToken · identity graph",
    pocIds: ["sa-key-theft", "sa-impersonation", "vm-sa-escalation", "gcs-exfil"],
  },
  {
    id: "ai-data-plane",
    category: "ai",
    title: "Story 1 — Unauthenticated AI abuse",
    blurb: "Prompt abuse through the open chat endpoint, then wipe and rebuild RAG without authentication.",
    upwindFocus: "Communication to External AI Service · AI SPM · unauthorized admin",
    pocIds: ["ai-chat-unauth", "unauth-reindex"],
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
