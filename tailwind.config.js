/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        display: ['"Chakra Petch"', "sans-serif"],
        sans: ['"Outfit"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      colors: {
        cryo: {
          950: "#06121f",
          900: "#0b1a2b",
          800: "#0f2438",
          700: "#16314b",
          600: "#1d4063",
          500: "#26598a",
        },
        ice: {
          400: "#38bdf8",
          300: "#7dd3fc",
          200: "#bae6fd",
        },
        frost: "#22d3ee",
        amber: {
          alert: "#f59e0b",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(56,189,248,0.25), 0 0 24px -6px rgba(56,189,248,0.45)",
        alert: "0 0 0 1px rgba(239,68,68,0.35), 0 0 24px -4px rgba(239,68,68,0.55)",
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.7)", opacity: "0.9" },
          "70%": { transform: "scale(2.2)", opacity: "0" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        pulseRing: "pulseRing 1.8s cubic-bezier(0.4,0,0.2,1) infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};
