import { NextResponse } from "next/server";
import { proxyChat } from "@/lib/demoLab";

const PROXY_ROUTES: Record<string, string> = {
  pillow: "/demo/exploit/pillow",
  "cve-probe-story": "/demo/exploit/cve-probe-story",
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
  "langchain-ai": "/demo/exploit/langchain-ai",
  "ai-prompt-injection": "/demo/exploit/ai-prompt-injection",
  "ai-sensitive-disclosure": "/demo/exploit/ai-sensitive-disclosure",
  "ai-poison": "/demo/exploit/ai-poison",
  "ai-xss-output": "/demo/exploit/ai-xss-output",
  "ai-system-prompt-leak": "/demo/exploit/ai-system-prompt-leak",
  "ai-rag-embedding": "/demo/exploit/ai-rag-embedding",
  "ai-unbounded": "/demo/exploit/ai-unbounded",
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
