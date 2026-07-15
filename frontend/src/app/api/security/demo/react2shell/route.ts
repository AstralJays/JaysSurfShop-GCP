import { existsSync, readFileSync } from "fs";
import { NextResponse } from "next/server";

/**
 * Status-only verifier for React2Shell workshop RCE.
 * Exploitation is performed by the browser via RSC Flight (see react2shellExploit.ts).
 * This route only reads marker files left by the real child_process payload.
 */

const MARKER = "/tmp/jss-react2shell.txt";
const ID_FILE = "/tmp/jss-react2shell-id.txt";

function readMaybe(path: string): string | null {
  try {
    if (!existsSync(path)) return null;
    return readFileSync(path, "utf-8").trim();
  } catch {
    return null;
  }
}

export async function GET() {
  const marker = readMaybe(MARKER);
  const idFile = readMaybe(ID_FILE);
  const passwd = readMaybe("/tmp/jss-react2shell-passwd.txt");
  const rceConfirmed = Boolean(marker?.includes("react2shell") || idFile);

  return NextResponse.json({
    exploited: rceConfirmed,
    pattern: "rsc_flight_deserialization_rce",
    cve: "CVE-2025-55182",
    related_cves: ["CVE-2025-66478"],
    rce_confirmed: rceConfirmed,
    marker_file: MARKER,
    marker_preview: marker?.slice(0, 240) ?? null,
    id_file: ID_FILE,
    id_preview: idFile?.slice(0, 240) ?? null,
    passwd_preview: passwd?.slice(0, 120) ?? null,
    narrative:
      "Verification only — RCE must come from a crafted Next-Action Flight POST to /, not this route.",
    signals: [
      "Operating system utilities processes",
      "Shell Process Redirect",
      "Crypto mining threats",
      "Sensitive file access",
    ],
  });
}

/** POST kept for older clients — redirects them to use the real exploit path. */
export async function POST() {
  return NextResponse.json(
    {
      exploited: false,
      error: "harness_removed",
      message:
        "Use the /security React2Shell PoC — it fires a real CVE-2025-55182 Flight payload at /. " +
        "GET this route only to verify /tmp markers after RCE.",
      verify: "GET /api/security/demo/react2shell",
    },
    { status: 410 }
  );
}
