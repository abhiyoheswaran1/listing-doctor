import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "oklch(var(--color-base) / <alpha-value>)",
        panel: "oklch(var(--color-panel) / <alpha-value>)",
        raised: "oklch(var(--color-raised) / <alpha-value>)",
        line: "oklch(var(--color-line) / <alpha-value>)",
        ink: "oklch(var(--color-ink) / <alpha-value>)",
        muted: "oklch(var(--color-muted) / <alpha-value>)",
        accent: "oklch(var(--color-accent) / <alpha-value>)",
        "accent-ink": "oklch(var(--color-accent-ink) / <alpha-value>)",
        success: "oklch(var(--color-success) / <alpha-value>)",
        warning: "oklch(var(--color-warning) / <alpha-value>)",
        danger: "oklch(var(--color-danger) / <alpha-value>)",
      },
      boxShadow: {
        panel: "0 1px 2px oklch(0.2 0.02 95 / 0.08), 0 10px 22px oklch(0.2 0.02 95 / 0.06)",
        insetLine: "inset 0 0 0 1px oklch(var(--color-line) / 1)",
      },
      fontFamily: {
        sans: [
          "Arial",
          "Helvetica",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      borderRadius: {
        panel: "6px",
      },
    },
  },
  plugins: [],
};

export default config;
