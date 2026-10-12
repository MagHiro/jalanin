import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          hover: "var(--primary-hover)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          hover: "var(--secondary-hover)",
        },
        accent: "var(--accent)",
        surface: {
          DEFAULT: "var(--surface)",
          elevated: "var(--surface-elevated)",
        },
        muted: { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" },
        border: "var(--border)",
        ring: "var(--ring)",
        success: { DEFAULT: "var(--success)", bg: "var(--success-bg)" },
        warning: { DEFAULT: "var(--warning)", bg: "var(--warning-bg)" },
        error: { DEFAULT: "var(--error)", bg: "var(--error-bg)" },
        info: { DEFAULT: "var(--info)", bg: "var(--info-bg)" },
        rail: {
          DEFAULT: "var(--rail)",
          raised: "var(--rail-raised)",
          foreground: "var(--rail-foreground)",
          muted: "var(--rail-muted)",
        },
        jalanin: {
          50: "var(--jalanin-50)",
          100: "var(--jalanin-100)",
          200: "var(--jalanin-200)",
          300: "var(--jalanin-300)",
          400: "var(--jalanin-400)",
          500: "var(--jalanin-500)",
          600: "var(--jalanin-600)",
          700: "var(--jalanin-700)",
          800: "var(--jalanin-800)",
          900: "var(--jalanin-900)",
          950: "var(--jalanin-950)",
        },
      },
      borderRadius: {
        card: "var(--radius)",
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
      },
      boxShadow: {
        subtle: "var(--shadow-subtle)",
        float: "var(--shadow-float)",
        modal: "var(--shadow-modal)",
      },
    },
  },
  plugins: [],
};
export default config;
