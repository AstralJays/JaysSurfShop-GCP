"use client";

import { useState } from "react";

const GUIDES = [
  { name: "readme.txt", label: "Asset CDN readme", blurb: "How our public document CDN is laid out." },
  { name: "wax-care.txt", label: "Wax & deck care", blurb: "Base coats, water temp, and scrape tips." },
];

export default function GuidesPage() {
  const [active, setActive] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [dlError, setDlError] = useState("");
  const [tip, setTip] = useState("");
  const [tipStatus, setTipStatus] = useState("");
  const [tipBusy, setTipBusy] = useState(false);

  async function openGuide(name: string) {
    setDlError("");
    setActive(name);
    setContent("");
    try {
      const res = await fetch(`/api/downloads/asset?name=${encodeURIComponent(name)}`);
      const data = await res.json();
      if (!res.ok) {
        setDlError(data.detail || "Could not open guide");
        return;
      }
      setContent(typeof data.content === "string" ? data.content : JSON.stringify(data, null, 2));
    } catch {
      setDlError("Download service unavailable");
    }
  }

  async function submitTip(e: React.FormEvent) {
    e.preventDefault();
    setTipBusy(true);
    setTipStatus("");
    try {
      const res = await fetch("/api/community/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tip }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTipStatus(data.detail || "Could not submit tip");
        return;
      }
      setTipStatus("Thanks — Maya may quote this for other shoppers.");
      setTip("");
    } catch {
      setTipStatus("Could not reach the shop.");
    } finally {
      setTipBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">Resources</p>
      <h1 className="font-display text-3xl font-bold text-ocean-900 mt-1">Guides & tips</h1>
      <p className="text-ocean-600 text-sm mt-2 leading-relaxed">
        Care sheets from the shop floor, plus a place to share local knowledge with other surfers.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold text-ocean-900">Downloads</h2>
        <ul className="mt-4 space-y-3">
          {GUIDES.map((g) => (
            <li key={g.name}>
              <button
                type="button"
                onClick={() => openGuide(g.name)}
                className="w-full text-left rounded-xl border border-ocean-200 bg-white px-4 py-3 hover:border-ocean-400 transition"
              >
                <span className="font-medium text-ocean-900">{g.label}</span>
                <span className="block text-xs text-ocean-500 mt-0.5">{g.blurb}</span>
              </button>
            </li>
          ))}
        </ul>
        {dlError && (
          <p className="mt-3 text-sm text-coral-700 bg-coral-50 rounded-lg px-3 py-2">{dlError}</p>
        )}
        {active && content && (
          <pre className="mt-4 overflow-x-auto rounded-xl border border-ocean-100 bg-ocean-50/60 p-4 text-xs text-ocean-800 whitespace-pre-wrap">
            {content}
          </pre>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-bold text-ocean-900">Share a tip</h2>
        <p className="text-sm text-ocean-600 mt-1">
          Local conditions, wax tricks, parking — Maya pulls from community tips when shoppers ask.
        </p>
        <form onSubmit={submitTip} className="mt-4 space-y-3">
          <textarea
            value={tip}
            onChange={(e) => setTip(e.target.value)}
            required
            rows={3}
            maxLength={500}
            placeholder="e.g. North side of the pier is cleaner after a west swell…"
            className="w-full rounded-xl border border-ocean-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
          />
          <button type="submit" className="btn-primary" disabled={tipBusy || !tip.trim()}>
            {tipBusy ? "Sending…" : "Submit tip"}
          </button>
          {tipStatus && <p className="text-sm text-ocean-700">{tipStatus}</p>}
        </form>
      </section>
    </div>
  );
}
