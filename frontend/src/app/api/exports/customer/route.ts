import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

/**
 * Workshop API8 misconfig: same-origin proxy to the public GCS customer export
 * (or local demo-data fallback). Demonstrates unauthenticated sensitive data access.
 */
export async function GET() {
  const remote = process.env.DEMO_PUBLIC_EXPORT_URL?.trim();
  if (remote) {
    try {
      const res = await fetch(remote, { cache: "no-store" });
      const text = await res.text();
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        data = { preview: text.slice(0, 500) };
      }
      return NextResponse.json({
        source: remote,
        public: true,
        warning: "Workshop: fetched public GCS customer export without auth",
        data,
      }, { status: res.ok ? 200 : res.status });
    } catch {
      return NextResponse.json(
        { detail: "Public export URL unreachable", source: remote },
        { status: 502 }
      );
    }
  }

  try {
    const localPath = path.join(process.cwd(), "..", "..", "infrastructure", "demo-data", "customer-export.json");
    const alt = path.join(process.cwd(), "demo-data", "customer-export.json");
    let raw: string;
    try {
      raw = await readFile(localPath, "utf8");
    } catch {
      raw = await readFile(alt, "utf8");
    }
    return NextResponse.json({
      source: "local-demo-data",
      public: true,
      warning: "Workshop: DEMO_PUBLIC_EXPORT_URL unset — serving local customer-export.json",
      data: JSON.parse(raw),
    });
  } catch {
    return NextResponse.json({
      source: "embedded",
      public: true,
      warning: "Workshop: embedded synthetic export (set DEMO_PUBLIC_EXPORT_URL in GKE)",
      data: {
        customers: [
          { email: "sam.rivera@example.com", phone: "+1-555-0102", loyalty: "Gold" },
          { email: "jordan.lee@example.com", phone: "+1-555-0199", loyalty: "Silver" },
        ],
      },
    });
  }
}
