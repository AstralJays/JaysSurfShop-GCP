export const CHAT_SERVICE_URL =
  process.env.CHAT_SERVICE_URL || "http://chat-rag:8001";

export async function proxyChat(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const url = `${CHAT_SERVICE_URL}${path}`;
  return fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
}
