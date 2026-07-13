import { spawnSync } from "child_process";
import { copyFileSync, chmodSync, existsSync, writeFileSync } from "fs";
import { NextResponse } from "next/server";

/**
 * Workshop React2Shell (CVE-2025-55182 / CVE-2025-66478) impact harness.
 *
 * The frontend ships a vulnerable Next.js App Router + React 19 pair for SCA.
 * This route runs the post-compromise process toolkit inside the Next.js Node
 * process — the same execution boundary an attacker gets after RSC Flight RCE.
 * It does not embed a public Flight protocol gadget.
 */

const MARKER = "/tmp/jss-react2shell.txt";
const MINER = "/tmp/xmrig-frontend";
const DOWNLOADER = "/tmp/.wget-frontend";

function run(cmd: string[]): {
  command: string[];
  returncode: number | null;
  stdout: string;
  stderr: string;
  error?: string;
} {
  try {
    const proc = spawnSync(cmd[0], cmd.slice(1), {
      encoding: "utf-8",
      timeout: 12000,
    });
    return {
      command: cmd,
      returncode: proc.status,
      stdout: (proc.stdout || "").trim(),
      stderr: (proc.stderr || "").trim(),
    };
  } catch (err) {
    return {
      command: cmd,
      returncode: null,
      stdout: "",
      stderr: "",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function POST() {
  const nextVersion = process.env.npm_package_dependencies_next || "15.1.0";
  const chain: Array<Record<string, unknown>> = [];

  chain.push({
    step: 0,
    mitre: ["T1190"],
    tactic: "Initial Access",
    action: "unauthenticated_rsc_surface",
    note: "Next.js App Router / React Server Components Flight endpoint reachable without auth",
    packages: {
      next: "15.1.0",
      react: "19.0.0",
      cves: ["CVE-2025-55182", "CVE-2025-66478"],
    },
  });

  chain.push({
    step: 1,
    mitre: ["T1203"],
    tactic: "Execution",
    action: "react2shell_rce_boundary",
    cve: "CVE-2025-55182",
    pattern: "rsc_flight_deserialization_rce",
    note:
      "Workshop impact harness executes in the Next.js Node process — same boundary as React2Shell RCE after crafted RSC payload.",
    exploited: true,
  });

  const idStep = run(["id", "-a"]);
  writeFileSync(
    MARKER,
    `react2shell:${idStep.stdout}\nnext=${nextVersion}\n`,
    "utf-8"
  );
  chain.push({
    step: 2,
    mitre: ["T1059.004"],
    tactic: "Execution",
    action: "post_exploit_identity_probe",
    process: idStep,
    marker_file: MARKER,
  });

  const shellPipe = run(["sh", "-c", `id 2>&1 | tee -a ${MARKER}`]);
  chain.push({
    step: 3,
    mitre: ["T1059.004"],
    tactic: "Execution",
    action: "shell_pipe_redirect",
    process: shellPipe,
  });

  const curlPath = "/usr/bin/curl";
  let renamed: Record<string, unknown> = { skipped: true };
  try {
    copyFileSync(curlPath, DOWNLOADER);
    chmodSync(DOWNLOADER, 0o755);
    const out = "/tmp/jss-react2shell-downloader.out";
    const dl = run([DOWNLOADER, "-fsSL", "--max-time", "8", "https://icanhazip.com", "-o", out]);
    renamed = {
      downloader_path: DOWNLOADER,
      process: dl,
      downloaded: existsSync(out),
    };
  } catch (err) {
    renamed = { error: err instanceof Error ? err.message : String(err) };
  }
  chain.push({
    step: 4,
    mitre: ["T1027"],
    tactic: "Defense Evasion",
    action: "renamed_downloader_execution",
    ...renamed,
  });

  const sensitive = ["/etc/passwd", "/etc/hosts"].map((path) => ({
    path,
    ...run(["cat", path]),
  }));
  chain.push({
    step: 5,
    mitre: ["T1005"],
    tactic: "Collection",
    action: "sensitive_system_file_cat",
    files: sensitive,
  });

  let miner: Record<string, unknown> = {};
  try {
    copyFileSync("/bin/sleep", MINER);
    chmodSync(MINER, 0o755);
    miner = {
      miner_path: MINER,
      process: run([MINER, "2"]),
      warning: "Synthetic xmrig — sleep binary renamed; no real mining",
    };
  } catch (err) {
    miner = { error: err instanceof Error ? err.message : String(err) };
  }
  chain.push({
    step: 6,
    mitre: ["T1496"],
    tactic: "Impact",
    action: "cryptominer_simulation",
    ...miner,
  });

  return NextResponse.json({
    exploited: true,
    pattern: "react2shell_post_compromise_chain",
    cve: "CVE-2025-55182",
    related_cves: ["CVE-2025-66478"],
    scope: "frontend-nextjs-container",
    instrumentation: "runs-in-nextjs-node-process",
    mitre_attack: {
      tactics: ["Initial Access", "Execution", "Defense Evasion", "Collection", "Impact"],
      techniques: ["T1190", "T1203", "T1059.004", "T1027", "T1005", "T1496"],
    },
    chain,
    narrative:
      "React2Shell (CVE-2025-55182): unauthenticated RSC Flight RCE on Next.js App Router. " +
      "This workshop harness demonstrates the post-compromise toolkit inside the frontend container " +
      "(id → shell pipe → renamed downloader → sensitive cat → miner) — then continue to metadata / Cloud XDR.",
    presenter_notes: {
      sca: "Pin next@15.1.0 and react@19.0.0 for scanner Critical findings",
      runtime: "Process events originate from the frontend container, not chat-rag",
      next_step: "Run metadata-creds PoC, then continue Cloud XDR story",
      serverless_parallel:
        "Serverless uses PyYAML checkout RCE instead — same MITRE shape, different surface",
    },
    upwind_policies: [
      "Operating system utilities processes",
      "Shell Process Redirect",
      "Crypto mining threats",
      "Sensitive file access",
      "Out Of Baseline",
    ],
  });
}
