import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        sand: {
          50: "#fdf8f3",
          100: "#f9efe3",
          200: "#f2dcc4",
          300: "#e8c49a",
          400: "#dca56c",
          500: "#cf8a4a",
        },
        coral: {
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
        },
        arcade: {
          yellow: "#ffd700",
          orange: "#ff6b00",
          cyan: "#00e5ff",
          purple: "#9d00ff",
          red: "#ff0040",
          dark: "#0a0a12",
          panel: "#12121f",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        arcade: ["var(--font-arcade)", "Impact", "sans-serif"],
      },
      backgroundImage: {
        "wave-pattern": "url(\"data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 Q 25 0, 50 10 T 100 10' fill='none' stroke='%230ea5e9' stroke-opacity='0.08' stroke-width='2'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};

export default config;
