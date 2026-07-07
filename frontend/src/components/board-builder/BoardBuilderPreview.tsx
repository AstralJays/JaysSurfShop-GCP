"use client";

import { useId, useMemo } from "react";

const COLOR_MAP: Record<string, string> = {
  "ocean blue": "#0ea5e9",
  "sunset orange": "#f97316",
  "seafoam green": "#2dd4bf",
  "coral pink": "#fb7185",
  "midnight black": "#1e293b",
  "sand beige": "#d4a574",
  "electric yellow": "#facc15",
  "deep purple": "#7c3aed",
  white: "#f8fafc",
};

function resolveColor(name: string): string {
  const key = name.trim().toLowerCase();
  if (COLOR_MAP[key]) return COLOR_MAP[key];
  if (key.startsWith("#") && /^#[0-9a-f]{3,8}$/i.test(key)) return key;
  return "#0ea5e9";
}

/** Top-down board outline: nose at top, tail at bottom. viewBox 80 x 200 */
const BOARD_SHAPES: Record<string, string> = {
  shortboard:
    "M 40 8 C 48 8 52 20 52 40 L 54 155 C 54 168 48 192 40 192 C 32 192 26 168 26 155 L 28 40 C 28 20 32 8 40 8 Z",
  funboard:
    "M 40 6 C 52 6 58 22 58 45 L 56 150 C 56 172 50 194 40 194 C 30 194 24 172 24 150 L 22 45 C 22 22 28 6 40 6 Z",
  longboard:
    "M 40 4 C 46 4 50 12 50 30 L 48 175 C 48 188 44 196 40 196 C 36 196 32 188 32 175 L 30 30 C 30 12 34 4 40 4 Z",
  fish:
    "M 40 10 C 54 10 62 28 62 50 L 58 140 C 56 155 48 168 40 178 C 32 168 24 155 22 140 L 18 50 C 18 28 26 10 40 10 Z",
  gun:
    "M 40 6 C 46 6 48 18 48 35 L 49 165 C 49 182 44 194 40 194 C 36 194 31 182 31 165 L 32 35 C 32 18 34 6 40 6 Z",
};

const FIN_LAYOUT: Record<string, { cx: number; cy: number; w: number }[]> = {
  shortboard: [
    { cx: 40, cy: 178, w: 6 },
    { cx: 32, cy: 182, w: 4 },
    { cx: 48, cy: 182, w: 4 },
  ],
  funboard: [{ cx: 40, cy: 180, w: 8 }],
  longboard: [{ cx: 40, cy: 185, w: 10 }],
  fish: [
    { cx: 30, cy: 168, w: 5 },
    { cx: 50, cy: 168, w: 5 },
  ],
  gun: [{ cx: 40, cy: 186, w: 5 }],
};

interface BoardBuilderPreviewProps {
  boardType: string;
  primaryColor: string;
  secondaryColor: string;
  pattern: string;
  className?: string;
}

export default function BoardBuilderPreview({
  boardType,
  primaryColor,
  secondaryColor,
  pattern,
  className = "",
}: BoardBuilderPreviewProps) {
  const uid = useId().replace(/:/g, "");
  const primary = resolveColor(primaryColor);
  const secondary = resolveColor(secondaryColor);
  const shape = BOARD_SHAPES[boardType] || BOARD_SHAPES.shortboard;
  const fins = FIN_LAYOUT[boardType] || FIN_LAYOUT.shortboard;

  const deckFill = useMemo(() => {
    switch (pattern.toLowerCase()) {
      case "gradient":
        return `url(#grad-${uid})`;
      case "sunset":
        return `url(#sunset-${uid})`;
      case "stripes":
        return `url(#stripes-${uid})`;
      default:
        return primary;
    }
  }, [pattern, primary, secondary, uid]);

  return (
    <svg
      viewBox="0 0 80 200"
      className={`${className} drop-shadow-md`}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`grad-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={primary} />
          <stop offset="100%" stopColor={secondary} />
        </linearGradient>
        <linearGradient id={`sunset-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="50%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <pattern id={`stripes-${uid}`} width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill={primary} />
          <path d="M0 4 H8" stroke={secondary} strokeWidth="2" />
        </pattern>
        <clipPath id={`clip-${uid}`}>
          <path d={shape} />
        </clipPath>
      </defs>

      {/* Shadow */}
      <ellipse cx="40" cy="198" rx="22" ry="3" fill="rgba(0,0,0,0.12)" />

      {/* Rails (darker edge) */}
      <path d={shape} fill={darken(primary, 0.25)} />

      {/* Deck */}
      <path d={shape} fill={deckFill} stroke={darken(primary, 0.3)} strokeWidth="0.8" />

      {/* Pattern overlays */}
      {pattern === "wave" && (
        <g clipPath={`url(#clip-${uid})`} opacity="0.35">
          <path d="M 10 60 Q 25 50 40 60 T 70 60" fill="none" stroke={secondary} strokeWidth="2" />
          <path d="M 8 90 Q 28 78 40 90 T 72 90" fill="none" stroke={secondary} strokeWidth="2" />
          <path d="M 12 120 Q 30 108 40 120 T 68 120" fill="none" stroke={secondary} strokeWidth="2" />
        </g>
      )}
      {pattern === "tropical" && (
        <g clipPath={`url(#clip-${uid})`} opacity="0.4">
          <circle cx="35" cy="70" r="4" fill={secondary} />
          <circle cx="48" cy="95" r="3" fill={secondary} />
          <circle cx="32" cy="115" r="3.5" fill={secondary} />
        </g>
      )}
      {pattern === "geometric" && (
        <g clipPath={`url(#clip-${uid})`} opacity="0.3">
          <path d="M 20 40 L 60 100 M 60 40 L 20 100" stroke={secondary} strokeWidth="1.5" />
        </g>
      )}

      {/* Center stringer line */}
      <line x1="40" y1="25" x2="40" y2="170" stroke={secondary} strokeWidth="0.6" opacity="0.4" />

      {/* Fins */}
      {fins.map((f, i) => (
        <ellipse key={i} cx={f.cx} cy={f.cy} rx={f.w / 2} ry={f.w * 0.6} fill="#334155" opacity="0.85" />
      ))}
    </svg>
  );
}

function darken(hex: string, amount: number): string {
  const n = hex.replace("#", "");
  if (n.length !== 6) return hex;
  const r = Math.max(0, parseInt(n.slice(0, 2), 16) * (1 - amount));
  const g = Math.max(0, parseInt(n.slice(2, 4), 16) * (1 - amount));
  const b = Math.max(0, parseInt(n.slice(4, 6), 16) * (1 - amount));
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}
