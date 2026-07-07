"use client";

import { computeBoardStats, STAT_LABELS } from "@/lib/boardStats";

interface BoardStatBarsProps {
  stats: ReturnType<typeof computeBoardStats>;
}

/** Compact stats block for the builder sidebar */
export default function BoardStatBars({ stats }: BoardStatBarsProps) {
  return (
    <div className="rounded-lg bg-ocean-50 p-2.5 space-y-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">Stats</span>
        <span className="font-display text-base font-bold text-ocean-700">OVR {stats.overall}</span>
      </div>
      {STAT_LABELS.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-1.5 text-[10px]">
          <span className="w-10 shrink-0 text-ocean-500">{label.slice(0, 3)}</span>
          <div className="flex-1 h-1 rounded-full bg-ocean-200/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-ocean-500 transition-all duration-300"
              style={{ width: `${(stats[key] / 10) * 100}%` }}
            />
          </div>
          <span className="w-3 text-right font-semibold text-ocean-800">{stats[key]}</span>
        </div>
      ))}
    </div>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-semibold uppercase tracking-wider text-ocean-500 mb-1">
      {children}
    </label>
  );
}
