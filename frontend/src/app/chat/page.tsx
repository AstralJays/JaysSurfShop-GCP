"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CREW_STARTERS } from "@/lib/boardStats";
import { ORDER_CHAT_STARTERS, shippingChangeDraft } from "@/lib/demoOrders";
import type { ChatMessage } from "@/types";

interface MeUser {
  email: string;
  name: string;
  role: string;
}

function ChatContent() {
  const searchParams = useSearchParams();
  const orderParam = searchParams.get("order");
  const helpParam = searchParams.get("help");

  const [user, setUser] = useState<MeUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        return data.user as MeUser;
      })
      .then((u) => {
        setUser(u);
        const intro = u
          ? `Hey ${u.name.split(" ")[0]}! I'm Maya — your shop support assistant. I can see you're signed in. Ask about gear, or tell me an order number if you need a shipping change.`
          : "Hey! I'm Maya — Jay's Surf Shop support assistant. Sign in to manage your orders, or ask me about boards, wax, and wetsuits.";
        setMessages([{ role: "assistant", content: intro }]);
      })
      .catch(() => {
        setMessages([
          {
            role: "assistant",
            content:
              "Hey! I'm Maya — Jay's Surf Shop support assistant. Sign in to manage your orders, or ask me about gear.",
          },
        ]);
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (seededRef.current || !orderParam || !user) return;
    seededRef.current = true;
    let draft = shippingChangeDraft(orderParam);
    if (helpParam === "shipping") {
      draft = `Hi Maya — please update the shipping address on my order ${orderParam.toUpperCase()}. We moved.`;
    }
    setInput(draft);
  }, [orderParam, helpParam, user]);

  const starters = user
    ? ORDER_CHAT_STARTERS
    : [...ORDER_CHAT_STARTERS.slice(0, 1), ...CREW_STARTERS.slice(0, 2)];

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const history = messages.filter((m) => m.role !== "assistant" || messages.indexOf(m) > 0);

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: history.map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = await res.json();
      const reply =
        data.reply || data.detail || "Sorry, I couldn't reach the chat service.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error — is the chat service running?" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ocean-500">Shop support</p>
          <h1 className="font-display text-3xl font-bold text-ocean-900 mt-1">Chat with Maya</h1>
          <p className="text-ocean-600 text-sm mt-2">
            {user ? (
              <>
                Signed in as {user.name}.{" "}
                <Link href="/orders" className="font-semibold text-ocean-700 hover:underline">
                  View your orders
                </Link>
              </>
            ) : (
              <>
                <Link href="/login?next=/chat" className="font-semibold text-ocean-700 hover:underline">
                  Sign in
                </Link>{" "}
                to manage shipping on your account.
              </>
            )}
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-[120px_1fr] gap-5">
        <div className="hidden sm:block">
          <div className="card p-3 text-center sticky top-24">
            <div className="relative w-16 h-16 mx-auto rounded-full overflow-hidden ring-2 ring-ocean-200">
              <Image src="/logo.png" alt="Maya" fill className="object-cover" />
            </div>
            <p className="font-display font-bold text-ocean-900 mt-2 text-sm">Maya</p>
            <p className="text-[10px] text-ocean-500 uppercase tracking-wide">AI support</p>
          </div>
        </div>

        <div className="card flex flex-col min-h-[420px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[55vh]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start gap-2"}`}
              >
                {msg.role === "assistant" && (
                  <span className="hidden sm:inline text-[10px] font-semibold text-ocean-400 pt-2 shrink-0 w-8">
                    Maya
                  </span>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-ocean-600 text-white rounded-br-md"
                      : "bg-ocean-50 text-ocean-900 rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 items-center">
                <span className="text-[10px] font-semibold text-ocean-400 w-8">Maya</span>
                <div className="bg-ocean-50 rounded-2xl px-4 py-2 text-sm text-ocean-500">
                  Thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {starters.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  className="rounded-full border border-ocean-200 bg-white px-3 py-1.5 text-xs text-ocean-700 hover:bg-ocean-50 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            className="border-t border-ocean-100 p-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                user
                  ? "Ask about your order or gear…"
                  : "Ask about gear — sign in for order changes…"
              }
              className="flex-1 rounded-full border border-ocean-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
              disabled={loading}
            />
            <button type="submit" className="btn-primary" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-10 text-ocean-600">Loading chat…</div>}>
      <ChatContent />
    </Suspense>
  );
}
