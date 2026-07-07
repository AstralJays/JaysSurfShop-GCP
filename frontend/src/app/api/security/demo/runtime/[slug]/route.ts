import { NextResponse } from "next/server";
import { proxyChat } from "@/lib/demoLab";

const PROXY_ROUTES: Record<string, string> = {
  pillow: "/demo/exploit/pillow",
  "iam-abuse": "/demo/exploit/iam-abuse",
  "metadata-creds": "/demo/exploit/metadata-creds",
  "shell-pipe": "/demo/exploit/shell-pipe",
  "cryptominer-sim": "/demo/exploit/cryptominer-sim",
  "package-manager": "/demo/exploit/package-manager",
  "eicar-file": "/demo/exploit/eicar-file",
  "s3-exfil": "/demo/exploit/s3-exfil",
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
