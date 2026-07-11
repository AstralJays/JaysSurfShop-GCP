import { NextResponse } from "next/server";
import { proxyChat } from "@/lib/demoLab";

const PROXY_ROUTES: Record<string, string> = {
  pillow: "/demo/exploit/pillow",
  "iam-abuse": "/demo/exploit/iam-abuse",
  "metadata-creds": "/demo/exploit/metadata-creds",
  "shell-pipe": "/demo/exploit/shell-pipe",
  "cryptominer-sim": "/demo/exploit/cryptominer-sim",
  "curl-pipe-sh": "/demo/exploit/curl-pipe-sh",
  "renamed-downloader": "/demo/exploit/renamed-downloader",
  "package-manager": "/demo/exploit/package-manager",
  "sensitive-file-cat": "/demo/exploit/sensitive-file-cat",
  "eicar-file": "/demo/exploit/eicar-file",
  "gcs-exfil": "/demo/exploit/gcs-exfil",
  "sa-impersonation": "/demo/exploit/sa-impersonation",
  "sa-key-theft": "/demo/exploit/sa-key-theft",
  "vm-sa-escalation": "/demo/exploit/vm-sa-escalation",
};

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const path = PROXY_ROUTES[slug];
  if (!path) {
    return NextResponse.json({ detail: "Unknown PoC" }, { status: 404 });
  }

  try {
    const res = await proxyChat(path, { method: "POST" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { detail: "chat-rag service unavailable" },
      { status: 503 }
    );
  }
}
