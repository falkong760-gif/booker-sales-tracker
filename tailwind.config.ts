import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        // Light & Dark theme custom colors mapped directly
        navy: {
          DEFAULT: "#0F3D5C",
          light: "#1e5b85",
          dark: "#0a2645",
        },
        teal: {
          DEFAULT: "#0E8A7D",
          light: "#14b09e",
          dark: "#095c52",
        },
        "off-white": "#F7F9FA",
        charcoal: "#1F2937",
        "slate-gray": "#6B7280",

        // Strictly reserved status indicators (optimized for AA contrast)
        "success-green": {
          DEFAULT: "#16A34A",
          bright: "#22c55e",
        },
        "danger-red": {
          DEFAULT: "#DC2626",
          bright: "#ef4444",
        },
        "warning-amber": {
          DEFAULT: "#D97706",
          bright: "#f59e0b",
        },
        "border-gray": "#E5E7EB",

        // Mapped shadcn variables
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--popover) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        // High-end diffused dropshadows mimicking Apple depth
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.08)",
        "glass-dark": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glass-floating": "0 24px 64px -12px rgba(0, 0, 0, 0.12)",
        "glass-floating-dark": "0 24px 64px -12px rgba(0, 0, 0, 0.45)",
      },
      backdropBlur: {
        glass: "20px",
        "glass-heavy": "40px",
      },
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(40px, -60px) scale(1.15)" },
        },
        "pulse-reverse": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(-50px, 40px) scale(0.9)" },
        },
      },
      animation: {
        "pulse-slow": "pulse-slow 20s infinite ease-in-out",
        "pulse-reverse": "pulse-reverse 25s infinite ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
