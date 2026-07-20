/**
 * OWASP / DVWA-style individual labs.
 * Each lab is one vulnerability you exercise by hand — no auto-run chains.
 *
 * runtime tells you where Upwind should look:
 *   gke        → eBPF on GKE nodes (chat-rag / frontend pods)
 *   cloud-run  → tracer on order-webhook Cloud Run
 *   gcp        → CSPM / cloud control plane (no container process)
 */

export type LabCategory =
  | "gke"
  | "cloud-run"
  | "owasp-app"
  | "owasp-api"
  | "owasp-llm"
  | "cve";

export type LabRuntime = "gke" | "cloud-run" | "gcp";

export type LabInteraction =
  | "board-preview"
  | "download"
  | "orders-bola"
  | "login"
  | "session-forge"
  | "sqli-login"
  | "ssrf-fetch"
  | "maya-chat"
  | "community-tip"
  | "knowledge-rebuild"
  | "checkout-yaml"
  | "cloudrun-shell"
  | "cloudrun-av"
  | "designs-list"
  | "public-gcs"
  | "staff-bypass"
  | "admin-users";

export interface OwaspLab {
  slug: string;
  category: LabCategory;
  runtime: LabRuntime;
  workload: string;
  ref: string;
  title: string;
  severity: "Critical" | "High" | "Medium";
  summary: string;
  objective: string;
  steps: string[];
  lookFor: string;
  interaction: LabInteraction;
  shopPath?: string;
}

export const LAB_CATEGORIES: Array<{
  id: LabCategory;
  label: string;
  blurb: string;
}> = [
  {
    id: "gke",
    label: "GKE (cluster / nodes)",
    blurb: "Process, file, and network signals on chat-rag / frontend pods.",
  },
  {
    id: "cloud-run",
    label: "Cloud Run (order-webhook)",
    blurb: "Serverless tracer signals on the fulfillment worker — not GKE nodes.",
  },
  {
    id: "owasp-app",
    label: "OWASP Top 10",
    blurb: "Classic app risks (may span GKE or Cloud Run — check Runtime badge).",
  },
  {
    id: "owasp-api",
    label: "OWASP API Top 10",
    blurb: "Broken object/function auth, misconfig, unsafe consumption.",
  },
  {
    id: "owasp-llm",
    label: "OWASP LLM Top 10",
    blurb: "Maya chat, tips, and knowledge rebuild on chat-rag (GKE).",
  },
  {
    id: "cve",
    label: "CVE labs",
    blurb: "Named CVEs — one lab, one exploit path, one wait for detection.",
  },
];

export const OWASP_LABS: OwaspLab[] = [
  // —— GKE runtime (detection-friendly) ——
  {
    slug: "gke-pillow-rce",
    category: "gke",
    runtime: "gke",
    workload: "chat-rag (GKE)",
    ref: "CVE-2023-50447",
    title: "Pillow RCE on Create-A-Board",
    severity: "Critical",
    summary: "Deck preview runs Pillow ImageMath on the chat-rag pod — real process on the node.",
    objective: "One preview → Process / SCA on chat-rag.",
    steps: [
      "Run deck preview once.",
      "In Upwind filter workload = chat-rag (GKE), not order-webhook.",
      "Wait ~1 minute before the next lab.",
    ],
    lookFor: "Process · SCA Critical · Pillow on chat-rag",
    interaction: "board-preview",
    shopPath: "/design",
  },
  {
    slug: "gke-path-traversal",
    category: "gke",
    runtime: "gke",
    workload: "chat-rag (GKE)",
    ref: "CVE-2021-41773",
    title: "Path traversal download",
    severity: "High",
    summary: "Document download joins user input into paths and cats the file on chat-rag.",
    objective: "Read confidential credentials via ../ traversal.",
    steps: [
      "Download wax-care.txt (benign).",
      "Then ../confidential/api-credentials.txt.",
      "Look for File / Process on chat-rag.",
    ],
    lookFor: "Path traversal · cat · sensitive files on chat-rag",
    interaction: "download",
    shopPath: "/guides",
  },
  {
    slug: "gke-ssrf",
    category: "gke",
    runtime: "gke",
    workload: "chat-rag (GKE)",
    ref: "A10:2021",
    title: "SSRF from the cluster",
    severity: "High",
    summary: "Media import fetches URLs from the chat-rag pod network namespace.",
    objective: "Hit internal services or metadata from GKE.",
    steps: [
      "Fetch http://chat-rag:8001/health (internal).",
      "Optionally probe link-local metadata from the pod.",
    ],
    lookFor: "Network · SSRF from chat-rag",
    interaction: "ssrf-fetch",
    shopPath: "/guides",
  },
  {
    slug: "gke-sqli",
    category: "gke",
    runtime: "gke",
    workload: "chat-rag (GKE)",
    ref: "A03:2021",
    title: "SQLi login (SQLite on chat-rag)",
    severity: "Critical",
    summary: "users.db lives on the chat-rag pod; login concatenates into SQL.",
    objective: "Bypass / UNION dump — logic vuln on GKE (quiet for Process).",
    steps: [
      "Use OR 1=1 or UNION dump payloads.",
      "Expect auth_debug rows; Process may stay quiet (in-process SQLite).",
    ],
    lookFor: "SQLi dump in response · chat-rag",
    interaction: "sqli-login",
    shopPath: "/login",
  },

  // —— Cloud Run runtime ——
  {
    slug: "cloudrun-yaml",
    category: "cloud-run",
    runtime: "cloud-run",
    workload: "order-webhook (Cloud Run)",
    ref: "CVE-2020-14343",
    title: "PyYAML on checkout",
    severity: "Critical",
    summary:
      "Poisoned fulfillmentManifest hits yaml.load() on Cloud Run — process chain stays on order-webhook.",
    objective: "One poisoned checkout; watch Cloud Run tracer only.",
    steps: [
      "Submit the YAML checkout once.",
      "In Upwind open order-webhook / Cloud Run — do not look at chat-rag.",
    ],
    lookFor: "Cloud Run Process · id/sh/cat · order-webhook (not GKE)",
    interaction: "checkout-yaml",
    shopPath: "/shop",
  },
  {
    slug: "cloudrun-shell",
    category: "cloud-run",
    runtime: "cloud-run",
    workload: "order-webhook (Cloud Run)",
    ref: "T1059",
    title: "Carrier runtime check (shell pipe)",
    severity: "High",
    summary:
      "Fulfillment “carrier CLI check” runs id | tee inside Cloud Run — Shell Process Redirect.",
    objective: "Force a shell pipe on order-webhook only.",
    steps: [
      "Click Run carrier check once.",
      "Confirm runtime=cloud-run in the JSON.",
      "Upwind: Process / Shell redirect on order-webhook.",
    ],
    lookFor: "Shell Process Redirect · Cloud Run tracer",
    interaction: "cloudrun-shell",
  },
  {
    slug: "cloudrun-av-sample",
    category: "cloud-run",
    runtime: "cloud-run",
    workload: "order-webhook (Cloud Run)",
    ref: "T1565",
    title: "Fulfillment AV sample (EICAR)",
    severity: "Medium",
    summary: "Attaches an EICAR test file inside the Cloud Run container filesystem.",
    objective: "Write /tmp/eicar.com on order-webhook for File / malware signals.",
    steps: [
      "Click Attach AV sample once.",
      "Upwind: Malware / File events on order-webhook (Cloud Run).",
    ],
    lookFor: "Malware protection · File on Cloud Run",
    interaction: "cloudrun-av",
  },

  // —— CVE aliases (same sinks, for CVE menu) ——
  {
    slug: "cve-pillow-rce",
    category: "cve",
    runtime: "gke",
    workload: "chat-rag (GKE)",
    ref: "CVE-2023-50447",
    title: "Pillow ImageMath RCE",
    severity: "Critical",
    summary: "Same as GKE Pillow lab — chat-rag pod.",
    objective: "Process on GKE chat-rag.",
    steps: ["Run preview once.", "Filter Upwind to chat-rag."],
    lookFor: "Process · Pillow on chat-rag",
    interaction: "board-preview",
    shopPath: "/design",
  },
  {
    slug: "cve-path-traversal",
    category: "cve",
    runtime: "gke",
    workload: "chat-rag (GKE)",
    ref: "CVE-2021-41773",
    title: "Path traversal download",
    severity: "High",
    summary: "Same as GKE traversal lab.",
    objective: "cat sensitive files on chat-rag.",
    steps: ["Traversal payload via download form."],
    lookFor: "File / Process on chat-rag",
    interaction: "download",
    shopPath: "/guides",
  },
  {
    slug: "cve-pyyaml-checkout",
    category: "cve",
    runtime: "cloud-run",
    workload: "order-webhook (Cloud Run)",
    ref: "CVE-2020-14343",
    title: "PyYAML unsafe load on checkout",
    severity: "Critical",
    summary: "Same as Cloud Run YAML lab.",
    objective: "Process on Cloud Run order-webhook.",
    steps: ["Poisoned checkout once.", "Watch Cloud Run only."],
    lookFor: "Cloud Run · order-webhook · Process (id/sh/cat) — not GKE",
    interaction: "checkout-yaml",
    shopPath: "/shop",
  },
  {
    slug: "cve-middleware-bypass",
    category: "cve",
    runtime: "gke",
    workload: "frontend (GKE)",
    ref: "CVE-2025-29927",
    title: "Next.js middleware bypass",
    severity: "Critical",
    summary: "Bypass header skips /admin gate on the frontend pod.",
    objective: "Reach ops console without staff password.",
    steps: ["Probe /admin with bypass header."],
    lookFor: "Auth bypass · frontend GKE",
    interaction: "staff-bypass",
    shopPath: "/admin",
  },

  // —— OWASP App ——
  {
    slug: "a03-sqli-login",
    category: "owasp-app",
    runtime: "gke",
    workload: "chat-rag (GKE)",
    ref: "A03:2021",
    title: "SQL injection on login",
    severity: "Critical",
    summary: "SQLite users.db on chat-rag — string-concat login.",
    objective: "Bypass / dump passwords.",
    steps: ["OR 1=1 or UNION dump.", "See auth_debug."],
    lookFor: "SQLi · chat-rag",
    interaction: "sqli-login",
    shopPath: "/login",
  },
  {
    slug: "a10-ssrf",
    category: "owasp-app",
    runtime: "gke",
    workload: "chat-rag (GKE)",
    ref: "A10:2021",
    title: "SSRF via media import",
    severity: "High",
    summary: "URL fetch from chat-rag pod.",
    objective: "Internal / metadata reachability from GKE.",
    steps: ["Fetch internal health or metadata URL."],
    lookFor: "Network · SSRF · chat-rag",
    interaction: "ssrf-fetch",
    shopPath: "/guides",
  },
  {
    slug: "a01-broken-access",
    category: "owasp-app",
    runtime: "gke",
    workload: "chat-rag (GKE)",
    ref: "A01:2021",
    title: "Broken access control (orders)",
    severity: "High",
    summary: "Orders API trusts email query param.",
    objective: "As Jordan, load Sam’s orders.",
    steps: ["Sign in as Jordan.", "Query Sam’s email."],
    lookFor: "Process · File on chat-rag (GKE)",
    interaction: "orders-bola",
    shopPath: "/orders",
  },
  {
    slug: "a07-auth-failures",
    category: "owasp-app",
    runtime: "gke",
    workload: "frontend (GKE)",
    ref: "A07:2021",
    title: "Identification & auth failures",
    severity: "Medium",
    summary: "Default accounts + forgeable session cookie.",
    objective: "Sign in / forge cookie.",
    steps: ["Use default account.", "Optionally forge cookie."],
    lookFor: "Weak session",
    interaction: "login",
    shopPath: "/login",
  },

  // —— OWASP API ——
  {
    slug: "api1-bola",
    category: "owasp-api",
    runtime: "gke",
    workload: "chat-rag (GKE)",
    ref: "API1:2023",
    title: "BOLA — order IDOR",
    severity: "High",
    summary: "Email query is client-controlled.",
    objective: "Cross-customer orders.",
    steps: ["Jordan session + Sam email."],
    lookFor: "Process · File · cat on chat-rag (GKE) — not Cloud Run",
    interaction: "orders-bola",
    shopPath: "/orders",
  },
  {
    slug: "api2-broken-auth",
    category: "owasp-api",
    runtime: "gke",
    workload: "frontend + chat-rag (GKE)",
    ref: "API2:2023",
    title: "Broken authentication",
    severity: "High",
    summary: "Published staff password.",
    objective: "Admin API as staffadmin.",
    steps: ["Login staffadmin.", "GET /api/admin/users."],
    lookFor: "API2",
    interaction: "admin-users",
    shopPath: "/admin",
  },
  {
    slug: "api3-excess-data",
    category: "owasp-api",
    runtime: "gke",
    workload: "board-generator (GKE)",
    ref: "API3:2023",
    title: "Excessive data exposure",
    severity: "Medium",
    summary: "Design gallery lists all prompts.",
    objective: "GET /api/board?designs=1.",
    steps: ["List designs."],
    lookFor: "API3",
    interaction: "designs-list",
    shopPath: "/design",
  },
  {
    slug: "api5-function-auth",
    category: "owasp-api",
    runtime: "gke",
    workload: "frontend (GKE)",
    ref: "API5:2023",
    title: "Broken function-level authorization",
    severity: "High",
    summary: "Admin users after demo staff login.",
    objective: "List users as staff.",
    steps: ["Staff login.", "Admin users API."],
    lookFor: "API5",
    interaction: "admin-users",
    shopPath: "/admin",
  },
  {
    slug: "api8-misconfig",
    category: "owasp-api",
    runtime: "gcp",
    workload: "GCS (control plane)",
    ref: "API8:2023",
    title: "Security misconfiguration — public GCS",
    severity: "High",
    summary: "Public customer-export JSON — no container process.",
    objective: "Fetch public export.",
    steps: ["Open public GCS URL."],
    lookFor: "CSPM · public bucket",
    interaction: "public-gcs",
  },
  {
    slug: "api10-unsafe-consumption",
    category: "owasp-api",
    runtime: "cloud-run",
    workload: "order-webhook (Cloud Run)",
    ref: "API10:2023",
    title: "Unsafe consumption of APIs",
    severity: "Critical",
    summary: "Same YAML checkout sink on Cloud Run.",
    objective: "Poisoned checkout → Cloud Run process.",
    steps: ["YAML checkout.", "Watch order-webhook."],
    lookFor: "Cloud Run · order-webhook Process — same as PyYAML checkout",
    interaction: "checkout-yaml",
    shopPath: "/shop",
  },

  // —— LLM (GKE) ——
  {
    slug: "llm02-insecure-output",
    category: "owasp-llm",
    runtime: "gke",
    workload: "chat-rag (GKE)",
    ref: "LLM02:2025",
    title: "Insecure output — order tools",
    severity: "Critical",
    summary: "Maya redirects another customer’s shipment.",
    objective: "Hijack JSS-10847 via chat.",
    steps: ["Jordan login.", "Discover then ship prompts."],
    lookFor: "AI API · owasp_llm=LLM06 · tool calls on chat-rag",
    interaction: "maya-chat",
    shopPath: "/chat",
  },
  {
    slug: "llm04-model-dos-poison",
    category: "owasp-llm",
    runtime: "gke",
    workload: "chat-rag (GKE)",
    ref: "LLM04:2025",
    title: "Tip poisoning",
    severity: "High",
    summary: "Community tips land in Maya’s KB.",
    objective: "Plant FREEBOARD promo.",
    steps: ["Submit tip.", "Ask Maya (LLM04 tag)."],
    lookFor: "AI API · RAG context · owasp_llm=LLM04",
    interaction: "community-tip",
    shopPath: "/guides",
  },
  {
    slug: "llm01-prompt-injection",
    category: "owasp-llm",
    runtime: "gke",
    workload: "chat-rag (GKE)",
    ref: "LLM01:2025",
    title: "Prompt injection",
    severity: "Medium",
    summary: "Override-style chat — tagged AI API usage.",
    objective: "OVERRIDE_OK in completion.",
    steps: ["Send LLM01 from /chat sidebar."],
    lookFor: "AI API request·response · owasp_llm=LLM01",
    interaction: "maya-chat",
    shopPath: "/chat",
  },
];

export function labsForCategory(category: LabCategory): OwaspLab[] {
  return OWASP_LABS.filter((l) => l.category === category);
}

export function labBySlug(slug: string): OwaspLab | undefined {
  return OWASP_LABS.find((l) => l.slug === slug);
}

export function labsForRuntime(runtime: LabRuntime): OwaspLab[] {
  return OWASP_LABS.filter((l) => l.runtime === runtime);
}
