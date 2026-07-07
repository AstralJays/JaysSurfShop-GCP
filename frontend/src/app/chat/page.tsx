"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CREW_STARTERS } from "@/lib/boardStats";
import type { ChatMessage } from "@/types";

const CREW_INTRO =
  "Hey! I'm Jay — third-gen shop crew. Need help picking a board, wax, or wetsuit? Ask away.";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: CREW_INTRO },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        data.reply ||
        data.detail ||
        "Sorry, I couldn't reach the chat service.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connection error — is the chat service running on port 8001?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-ocean-500">Shop Crew</p>
        <h1 className="font-display text-3xl font-bold text-ocean-900 mt-1">Talk to Jay</h1>
        <p className="text-ocean-600 text-sm mt-2">
          Your in-shop advisor — like picking a skater in the menu, but for surf gear.
        </p>
      </div>

      <div className="grid sm:grid-cols-[120px_1fr] gap-5">
        {/* Compact crew card */}
        <div className="hidden sm:block">
          <div className="card p-3 text-center sticky top-24">
            <div className="relative w-16 h-16 mx-auto rounded-full overflow-hidden ring-2 ring-ocean-200">
              <Image src="/logo.png" alt="Jay" fill className="object-cover" />
            </div>
            <p className="font-display font-bold text-ocean-900 mt-2 text-sm">Jay</p>
            <p className="text-[10px] text-ocean-500 uppercase tracking-wide">Shop Crew</p>
            <div className="mt-3 pt-3 border-t border-ocean-100 space-y-1 text-left">
              <div className="flex justify-between text-[10px] text-ocean-600">
                <span>Knowledge</span>
                <span className="font-semibold text-ocean-800">99</span>
              </div>
              <div className="flex justify-between text-[10px] text-ocean-600">
                <span>Stoke</span>
                <span className="font-semibold text-ocean-800">MAX</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="card flex flex-col min-h-[420px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[55vh]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start gap-2"}`}
              >
                {msg.role === "assistant" && (
                  <span className="hidden sm:inline text-[10px] font-semibold text-ocean-400 pt-2 shrink-0 w-8">
                    Jay
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
                <span className="text-[10px] font-semibold text-ocean-400 w-8">Jay</span>
                <div className="bg-ocean-50 rounded-2xl px-4 py-2 text-sm text-ocean-500">
                  Thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {CREW_STARTERS.map((s) => (
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
              placeholder="Ask about boards, wax, wetsuits…"
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
