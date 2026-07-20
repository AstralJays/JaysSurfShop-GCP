import { NextResponse } from "next/server";

const BOARD_URL = process.env.BOARD_SERVICE_URL || "http://localhost:8002";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${BOARD_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    const publicBoardUrl =
      process.env.NEXT_PUBLIC_BOARD_SERVICE_URL || "http://localhost:8002";
    return NextResponse.json({
      ...data,
      image_url: `${publicBoardUrl}${data.image_url}`,
    });
  } catch {
    return NextResponse.json(
      { detail: "Board generator unavailable. Is it running on port 8002?" },
      { status: 503 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("designs") === "1" ? "/designs" : "/options";
    const res = await fetch(`${BOARD_URL}${path}`);
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    if (path === "/designs" && Array.isArray(data.designs)) {
      const publicBoardUrl =
        process.env.NEXT_PUBLIC_BOARD_SERVICE_URL || "http://localhost:8002";
      return NextResponse.json({
        ...data,
        designs: data.designs.map((row: { image_url?: string }) => ({
          ...row,
          image_url: row.image_url?.startsWith("http")
            ? row.image_url
            : `${publicBoardUrl}${row.image_url}`,
        })),
      });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { detail: "Board generator unavailable" },
      { status: 503 }
    );
  }
}
