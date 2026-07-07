export interface BoardStats {
  speed: number;
  turn: number;
  style: number;
  paddle: number;
  waveRange: number;
  overall: number;
}

const TYPE_STATS: Record<string, Omit<BoardStats, "overall">> = {
  shortboard: { speed: 9, turn: 8, style: 7, paddle: 4, waveRange: 8 },
  funboard: { speed: 6, turn: 7, style: 6, paddle: 7, waveRange: 6 },
  longboard: { speed: 4, turn: 5, style: 9, paddle: 9, waveRange: 4 },
  fish: { speed: 8, turn: 9, style: 8, paddle: 5, waveRange: 5 },
  gun: { speed: 10, turn: 4, style: 6, paddle: 3, waveRange: 10 },
};

const PATTERN_STYLE: Record<string, number> = {
  solid: 0,
  gradient: 1,
  stripes: 2,
  tropical: 3,
  geometric: 2,
  sunset: 3,
  wave: 3,
};

export const STAT_LABELS: { key: keyof Omit<BoardStats, "overall">; label: string; abbr: string }[] = [
  { key: "speed", label: "Speed", abbr: "SPD" },
  { key: "turn", label: "Turn", abbr: "TRN" },
  { key: "style", label: "Style", abbr: "STY" },
  { key: "paddle", label: "Paddle", abbr: "PAD" },
  { key: "waveRange", label: "Wave Range", abbr: "WAV" },
];

export function computeBoardStats(boardType: string, pattern: string): BoardStats {
  const base = TYPE_STATS[boardType.toLowerCase()] || TYPE_STATS.shortboard;
  const styleBoost = PATTERN_STYLE[pattern.toLowerCase()] ?? 0;

  const stats = {
    speed: clamp(base.speed),
    turn: clamp(base.turn),
    style: clamp(base.style + styleBoost),
    paddle: clamp(base.paddle),
    waveRange: clamp(base.waveRange),
  };

  const overall = Math.round(
    (stats.speed + stats.turn + stats.style + stats.paddle + stats.waveRange) / 5
  );

  return { ...stats, overall };
}

function clamp(n: number): number {
  return Math.min(10, Math.max(1, n));
}

export const BOARD_TYPE_INFO: Record<string, { tagline: string; vibe: string }> = {
  shortboard: { tagline: "The ripper", vibe: "Fast & radical" },
  funboard: { tagline: "The all-rounder", vibe: "Easy learning curve" },
  longboard: { tagline: "The classic", vibe: "Glide & style points" },
  fish: { tagline: "The retro rocket", vibe: "Twin fin speed" },
  gun: { tagline: "The big gun", vibe: "Heavy water only" },
};

export const CREW_STARTERS = [
  "Build me a beginner setup",
  "What's the sickest board for small waves?",
  "Wax guide for SoCal winter",
  "Shop hours & location?",
];
