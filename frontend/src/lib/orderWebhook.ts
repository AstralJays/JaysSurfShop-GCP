export const ORDER_WEBHOOK_URL =
  process.env.ORDER_WEBHOOK_URL?.replace(/\/$/, "") || "";

export async function proxyOrderWebhook(
  path: string,
  init?: RequestInit
): Promise<Response> {
  if (!ORDER_WEBHOOK_URL) {
    return new Response(
      JSON.stringify({ detail: "ORDER_WEBHOOK_URL not configured (AWS deploy only)" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const url = `${ORDER_WEBHOOK_URL}${path.startsWith("/") ? path : `/${path}`}`;
  return fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
}

export interface OrderWebhookStatus {
  service?: string;
  status?: string;
  aws_runtime?: boolean;
  eicar_present?: boolean;
  pyyaml_version?: string | null;
  vulnerable_packages?: Array<{
    cve: string;
    package: string;
    service: string;
  }>;
}
