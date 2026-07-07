"use client";

import { useId } from "react";
import type { Product } from "@/types";

/* ── Surfboard configs ── */
const BOARD_PRODUCTS: Record<
  string,
  { shape: string; primary: string; secondary: string; pattern?: string; fins: { cx: number; cy: number; w: number }[] }
> = {
  "board-pipeline-pro": {
    shape: "M 40 8 C 48 8 52 20 52 40 L 54 155 C 54 168 48 192 40 192 C 32 192 26 168 26 155 L 28 40 C 28 20 32 8 40 8 Z",
    primary: "#0ea5e9",
    secondary: "#ffffff",
    pattern: "stripes",
    fins: [
      { cx: 40, cy: 178, w: 6 },
      { cx: 32, cy: 182, w: 4 },
      { cx: 48, cy: 182, w: 4 },
    ],
  },
  "board-malia-fun": {
    shape: "M 40 6 C 52 6 58 22 58 45 L 56 150 C 56 172 50 194 40 194 C 30 194 24 172 24 150 L 22 45 C 22 22 28 6 40 6 Z",
    primary: "#f59e0b",
    secondary: "#fef3c7",
    pattern: "gradient",
    fins: [{ cx: 40, cy: 180, w: 8 }],
  },
  "board-longboard-classic": {
    shape: "M 40 4 C 46 4 50 12 50 30 L 48 175 C 48 188 44 196 40 196 C 36 196 32 188 32 175 L 30 30 C 30 12 34 4 40 4 Z",
    primary: "#6366f1",
    secondary: "#e0e7ff",
    pattern: "solid",
    fins: [{ cx: 40, cy: 185, w: 10 }],
  },
  "board-fish-twin": {
    shape: "M 40 10 C 54 10 62 28 62 50 L 58 140 C 56 155 48 168 40 178 C 32 168 24 155 22 140 L 18 50 C 18 28 26 10 40 10 Z",
    primary: "#10b981",
    secondary: "#6ee7b7",
    pattern: "tropical",
    fins: [
      { cx: 30, cy: 168, w: 5 },
      { cx: 50, cy: 168, w: 5 },
    ],
  },
};

const WAX_PRODUCTS: Record<string, { body: string; label: string; accent: string }> = {
  "wax-tropical": { body: "#ea580c", label: "TROPICAL", accent: "#fdba74" },
  "wax-warm": { body: "#eab308", label: "WARM", accent: "#fef08a" },
  "wax-cool": { body: "#3b82f6", label: "COOL", accent: "#93c5fd" },
  "wax-cold": { body: "#1e40af", label: "COLD", accent: "#60a5fa" },
};

const SUIT_PRODUCTS: Record<
  string,
  {
    main: string;
    highlight: string;
    style: "full" | "hooded" | "shorty";
    zip: "chest" | "back";
    accent?: string;
  }
> = {
  "wetsuit-32-full": { main: "#0e7490", highlight: "#22d3ee", style: "full", zip: "chest", accent: "#f97316" },
  "wetsuit-43-hooded": { main: "#1e293b", highlight: "#475569", style: "hooded", zip: "back", accent: "#38bdf8" },
  "wetsuit-spring-short": { main: "#0891b2", highlight: "#67e8f9", style: "shorty", zip: "back", accent: "#fbbf24" },
  "wetsuit-54-cold": { main: "#0f172a", highlight: "#334155", style: "full", zip: "chest", accent: "#94a3b8" },
};

interface ProductIllustrationProps {
  product: Product;
  className?: string;
}

function darken(hex: string, amount: number): string {
  const n = hex.replace("#", "");
  if (n.length !== 6) return hex;
  const r = Math.max(0, parseInt(n.slice(0, 2), 16) * (1 - amount));
  const g = Math.max(0, parseInt(n.slice(2, 4), 16) * (1 - amount));
  const b = Math.max(0, parseInt(n.slice(4, 6), 16) * (1 - amount));
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

function SurfboardSvg({
  config,
  uid,
  className,
}: {
  config: (typeof BOARD_PRODUCTS)[string];
  uid: string;
  className: string;
}) {
  const { shape, primary, secondary, pattern, fins } = config;
  const deckFill =
    pattern === "gradient"
      ? `url(#grad-${uid})`
      : pattern === "stripes"
        ? `url(#stripes-${uid})`
        : primary;

  return (
    <svg viewBox="0 0 80 200" className={className} aria-hidden preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`grad-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={primary} />
          <stop offset="100%" stopColor={secondary} />
        </linearGradient>
        <pattern id={`stripes-${uid}`} width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill={primary} />
          <path d="M0 4 H8" stroke={secondary} strokeWidth="2" />
        </pattern>
        <clipPath id={`clip-${uid}`}>
          <path d={shape} />
        </clipPath>
      </defs>
      <ellipse cx="40" cy="198" rx="20" ry="2.5" fill="rgba(0,0,0,0.1)" />
      <path d={shape} fill={darken(primary, 0.2)} />
      <path d={shape} fill={deckFill} stroke={darken(primary, 0.35)} strokeWidth="0.8" />
      {pattern === "tropical" && (
        <g clipPath={`url(#clip-${uid})`} opacity="0.45">
          <circle cx="35" cy="70" r="3.5" fill={secondary} />
          <circle cx="48" cy="95" r="2.5" fill={secondary} />
          <circle cx="32" cy="120" r="3" fill={secondary} />
        </g>
      )}
      <line x1="40" y1="25" x2="40" y2="165" stroke={secondary} strokeWidth="0.5" opacity="0.35" />
      {fins.map((f, i) => (
        <ellipse key={i} cx={f.cx} cy={f.cy} rx={f.w / 2} ry={f.w * 0.55} fill="#334155" opacity="0.9" />
      ))}
    </svg>
  );
}

function WaxSvg({
  config,
  className,
}: {
  config: (typeof WAX_PRODUCTS)[string];
  className: string;
}) {
  return (
    <svg viewBox="0 0 100 120" className={className} aria-hidden preserveAspectRatio="xMidYMid meet">
      <ellipse cx="50" cy="112" rx="32" ry="4" fill="rgba(0,0,0,0.08)" />
      <rect x="22" y="28" width="56" height="68" rx="5" fill={config.body} />
      <rect x="25" y="32" width="50" height="14" rx="2" fill={config.accent} opacity="0.35" />
      <text x="50" y="72" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="system-ui">
        JAY&apos;S
      </text>
      <text x="50" y="86" textAnchor="middle" fill={config.accent} fontSize="8" fontWeight="600" fontFamily="system-ui">
        {config.label}
      </text>
      <rect x="30" y="92" width="40" height="4" rx="1" fill="rgba(255,255,255,0.25)" />
    </svg>
  );
}

function WetsuitSvg({
  config,
  uid,
  className,
}: {
  config: (typeof SUIT_PRODUCTS)[string];
  uid: string;
  className: string;
}) {
  const { main, highlight, style, zip, accent = "#ffffff" } = config;
  const shadow = darken(main, 0.35);
  const mid = darken(main, 0.12);
  const fill = `url(#suit-body-${uid})`;
  const isShorty = style === "shorty";
  const isHooded = style === "hooded";
  const legEnd = isShorty ? 118 : 168;
  const sleeveEnd = isShorty ? 72 : 92;

  return (
    <svg viewBox="0 0 120 180" className={className} aria-hidden preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`suit-body-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={highlight} stopOpacity="0.55" />
          <stop offset="45%" stopColor={main} />
          <stop offset="100%" stopColor={shadow} />
        </linearGradient>
        <linearGradient id={`suit-shine-${uid}`} x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`suit-clip-${uid}`}>
          <path
            d={`M 60 14
               C 72 14 78 22 78 32 L 78 38
               C 88 40 96 48 98 58 L 100 ${sleeveEnd}
               C 98 ${sleeveEnd + 6} 92 ${sleeveEnd + 8} 86 ${sleeveEnd + 4}
               L 82 ${sleeveEnd - 4} L 82 58
               L 78 58 L 74 ${legEnd - 8}
               C 72 ${legEnd} 68 ${legEnd + 2} 64 ${legEnd + 2}
               L 64 ${legEnd + 10} C 62 ${legEnd + 14} 58 ${legEnd + 14} 56 ${legEnd + 10}
               L 56 ${legEnd + 2}
               C 52 ${legEnd + 2} 48 ${legEnd} 46 ${legEnd - 8}
               L 42 58 L 38 58 L 34 ${sleeveEnd - 4}
               L 30 ${sleeveEnd + 4}
               C 24 ${sleeveEnd + 8} 18 ${sleeveEnd + 6} 16 ${sleeveEnd}
               L 18 58 C 20 48 28 40 38 38 L 38 32
               C 38 22 44 14 56 14 Z`}
          />
        </clipPath>
      </defs>

      <ellipse cx="60" cy="174" rx="34" ry="4" fill="rgba(0,0,0,0.12)" />

      {/* Hood */}
      {isHooded && (
        <g>
          <path
            d="M 44 10 C 44 2 52 0 60 0 C 68 0 76 2 76 10
               C 76 18 72 24 60 26 C 48 24 44 18 44 10 Z"
            fill={shadow}
          />
          <path
            d="M 46 12 C 46 6 52 3 60 3 C 68 3 74 6 74 12
               C 74 17 70 22 60 23 C 50 22 46 17 46 12 Z"
            fill={main}
            stroke={shadow}
            strokeWidth="0.6"
          />
          <ellipse cx="60" cy="20" rx="8" ry="5" fill="rgba(0,0,0,0.25)" />
        </g>
      )}

      {/* Body */}
      <path
        d={`M 60 14
           C 72 14 78 22 78 32 L 78 38
           C 88 40 96 48 98 58 L 100 ${sleeveEnd}
           C 98 ${sleeveEnd + 6} 92 ${sleeveEnd + 8} 86 ${sleeveEnd + 4}
           L 82 ${sleeveEnd - 4} L 82 58
           L 78 58 L 74 ${legEnd - 8}
           C 72 ${legEnd} 68 ${legEnd + 2} 64 ${legEnd + 2}
           L 64 ${legEnd + 10} C 62 ${legEnd + 14} 58 ${legEnd + 14} 56 ${legEnd + 10}
           L 56 ${legEnd + 2}
           C 52 ${legEnd + 2} 48 ${legEnd} 46 ${legEnd - 8}
           L 42 58 L 38 58 L 34 ${sleeveEnd - 4}
           L 30 ${sleeveEnd + 4}
           C 24 ${sleeveEnd + 8} 18 ${sleeveEnd + 6} 16 ${sleeveEnd}
           L 18 58 C 20 48 28 40 38 38 L 38 32
           C 38 22 44 14 56 14 Z`}
        fill={fill}
        stroke={shadow}
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Neoprene sheen */}
      <rect x="0" y="0" width="120" height="180" fill={`url(#suit-shine-${uid})`} clipPath={`url(#suit-clip-${uid})`} />

      {/* Collar */}
      {!isHooded && (
        <path
          d="M 48 30 C 52 26 56 25 60 25 C 64 25 68 26 72 30
             C 70 34 65 36 60 36 C 55 36 50 34 48 30 Z"
          fill={mid}
          stroke={shadow}
          strokeWidth="0.5"
        />
      )}

      {/* Chest panel */}
      <path
        d={`M 52 38 L 68 38 L 66 72 L 54 72 Z`}
        fill="rgba(255,255,255,0.06)"
        stroke={shadow}
        strokeWidth="0.4"
        opacity="0.8"
      />

      {/* Zip */}
      {zip === "chest" ? (
        <g>
          <line x1="60" y1="38" x2="60" y2="72" stroke={accent} strokeWidth="1.2" strokeLinecap="round" />
          <rect x="57" y="36" width="6" height="3" rx="1" fill={accent} />
          <circle cx="60" cy="74" r="2" fill={accent} opacity="0.9" />
        </g>
      ) : (
        <g opacity="0.5">
          <line x1="60" y1="32" x2="60" y2="100" stroke={accent} strokeWidth="0.8" strokeDasharray="2 2" />
        </g>
      )}

      {/* Seam lines */}
      <path d={`M 42 58 L 46 ${legEnd - 10}`} stroke={shadow} strokeWidth="0.5" opacity="0.5" fill="none" />
      <path d={`M 78 58 L 74 ${legEnd - 10}`} stroke={shadow} strokeWidth="0.5" opacity="0.5" fill="none" />
      <line x1="52" y1="72" x2="52" y2={legEnd - 6} stroke={shadow} strokeWidth="0.4" opacity="0.35" />
      <line x1="68" y1="72" x2="68" y2={legEnd - 6} stroke={shadow} strokeWidth="0.4" opacity="0.35" />

      {/* Knee panels (full suits) */}
      {!isShorty && (
        <>
          <ellipse cx="50" cy="130" rx="7" ry="9" fill="rgba(0,0,0,0.08)" />
          <ellipse cx="70" cy="130" rx="7" ry="9" fill="rgba(0,0,0,0.08)" />
        </>
      )}

      {/* Logo patch */}
      <rect x="52" y="82" width="16" height="10" rx="1.5" fill={accent} opacity="0.85" />
      <text x="60" y="89.5" textAnchor="middle" fill={shadow} fontSize="5" fontWeight="700" fontFamily="system-ui">
        JAY&apos;S
      </text>

      {/* Cuff highlights */}
      <ellipse cx="28" cy={sleeveEnd + 2} rx="5" ry="2" fill="rgba(255,255,255,0.15)" />
      <ellipse cx="92" cy={sleeveEnd + 2} rx="5" ry="2" fill="rgba(255,255,255,0.15)" />
      {!isShorty && (
        <>
          <ellipse cx="56" cy={legEnd + 8} rx="5" ry="2" fill="rgba(255,255,255,0.12)" />
          <ellipse cx="64" cy={legEnd + 8} rx="5" ry="2" fill="rgba(255,255,255,0.12)" />
        </>
      )}
    </svg>
  );
}

export default function ProductIllustration({ product, className = "" }: ProductIllustrationProps) {
  const uid = useId().replace(/:/g, "");

  if (product.category === "surfboards") {
    const config = BOARD_PRODUCTS[product.id] || BOARD_PRODUCTS["board-pipeline-pro"];
    return <SurfboardSvg config={config} uid={uid} className={className} />;
  }

  if (product.category === "wax") {
    const config = WAX_PRODUCTS[product.id] || WAX_PRODUCTS["wax-warm"];
    return <WaxSvg config={config} className={className} />;
  }

  const config = SUIT_PRODUCTS[product.id] || SUIT_PRODUCTS["wetsuit-32-full"];
  return <WetsuitSvg config={config} uid={uid} className={className} />;
}
