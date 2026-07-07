"use client";

import { useEffect, useMemo, useState } from "react";
import BoardBuilderPreview from "@/components/board-builder/BoardBuilderPreview";
import BoardStatBars, { FieldLabel } from "@/components/board-builder/BoardStatBars";
import { BOARD_TYPE_INFO, computeBoardStats } from "@/lib/boardStats";
import type { BoardDesignOptions } from "@/types";

interface DesignResult {
  image_url: string;
  prompt_used: string;
  design_id: string;
}

const DEFAULT_OPTIONS: BoardDesignOptions = {
  board_types: ["shortboard", "funboard", "longboard", "fish", "gun"],
  patterns: ["solid", "gradient", "stripes", "tropical", "geometric", "sunset", "wave"],
  color_suggestions: ["ocean blue", "sunset orange", "seafoam green", "coral pink"],
};

export default function DesignPage() {
  const [options, setOptions] = useState<BoardDesignOptions>(DEFAULT_OPTIONS);
  const [boardName, setBoardName] = useState("The Wave Slayer");
  const [boardType, setBoardType] = useState("shortboard");
  const [primaryColor, setPrimaryColor] = useState("ocean blue");
  const [secondaryColor, setSecondaryColor] = useState("white");
  const [pattern, setPattern] = useState("gradient");
  const [styleNotes, setStyleNotes] = useState("");
  const [length, setLength] = useState("6'2\"");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DesignResult | null>(null);
  const [error, setError] = useState("");

  const stats = useMemo(() => computeBoardStats(boardType, pattern), [boardType, pattern]);
  const typeInfo = BOARD_TYPE_INFO[boardType] || BOARD_TYPE_INFO.shortboard;

  useEffect(() => {
    fetch("/api/board")
      .then((r) => r.json())
      .then((data) => {
        if (data.board_types) setOptions(data);
      })
      .catch(() => {});
  }, []);

  async function generate() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          board_type: boardType,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          pattern,
          style_notes: styleNotes || `${boardName} custom deck`,
          length,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Generation failed");
        return;
      }
      setResult(data);
    } catch {
      setError("Could not reach the board generator. Is it running on port 8002?");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-ocean-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ocean-400";

  const pill = (active: boolean) =>
    `rounded-md px-2 py-0.5 text-[11px] capitalize transition ${
      active ? "bg-ocean-600 text-white" : "bg-white text-ocean-700 ring-1 ring-ocean-200 hover:bg-ocean-50"
    }`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">Create-A-Board</p>
          <h1 className="font-display text-2xl font-bold text-ocean-900">Build your board</h1>
        </div>
        <p className="hidden sm:block text-xs text-ocean-500 text-right max-w-xs">
          {boardName} · <span className="capitalize">{typeInfo.tagline}</span>
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="grid lg:grid-cols-[1fr_320px] min-h-[min(520px,75vh)]">
          {/* Main board display */}
          <div className="relative bg-gradient-to-br from-ocean-50 via-ocean-100 to-ocean-200 flex items-center justify-center p-6 lg:p-10">
            {result && !loading ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.image_url}
                alt={boardName}
                className="max-h-full max-w-full object-contain drop-shadow-lg"
              />
            ) : loading ? (
              <div className="text-center text-ocean-700">
                <div className="text-4xl animate-pulse mb-2">🏄</div>
                <p className="text-sm font-medium">Rendering deck art…</p>
              </div>
            ) : (
              <BoardBuilderPreview
                boardType={boardType}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                pattern={pattern}
                className="h-[min(420px,60vh)] w-auto"
              />
            )}
          </div>

          {/* Sidebar: stats + options */}
          <div className="flex flex-col border-t lg:border-t-0 lg:border-l border-ocean-100 bg-white p-4 gap-3">
            <BoardStatBars stats={stats} />

            <div className="space-y-2.5 flex-1">
              <div>
                <FieldLabel>Name</FieldLabel>
                <input
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  maxLength={24}
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel>Type</FieldLabel>
                <div className="flex flex-wrap gap-1">
                  {options.board_types.map((t) => (
                    <button key={t} type="button" onClick={() => setBoardType(t)} className={pill(boardType === t)}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel>Length</FieldLabel>
                  <input value={length} onChange={(e) => setLength(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <FieldLabel>Pattern</FieldLabel>
                  <select value={pattern} onChange={(e) => setPattern(e.target.value)} className={inputClass}>
                    {options.patterns.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>Primary</FieldLabel>
                  <input list="deck-colors" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <FieldLabel>Accent</FieldLabel>
                  <input list="deck-colors" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className={inputClass} />
                </div>
              </div>
              <datalist id="deck-colors">
                {options.color_suggestions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>

              <div>
                <FieldLabel>Style notes</FieldLabel>
                <input
                  value={styleNotes}
                  onChange={(e) => setStyleNotes(e.target.value)}
                  placeholder="Optional"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="pt-1 space-y-2 mt-auto">
              <button type="button" onClick={generate} disabled={loading} className="btn-primary w-full py-2 text-sm">
                {loading ? "Generating…" : "Generate board art"}
              </button>
              {result && (
                <p className="text-[10px] text-center text-teal-700">Rendered · {result.design_id}</p>
              )}
              {error && (
                <p className="text-[11px] text-coral-600 bg-coral-50 rounded-md px-2 py-1.5">{error}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
