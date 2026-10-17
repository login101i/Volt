import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        volt: {
          bg: "var(--volt-bg)",
          surface: "var(--volt-surface)",
          surface2: "var(--volt-surface2)",
          line: "var(--volt-line)",
          text: "var(--volt-text)",
          muted: "var(--volt-muted)",
          mint: "var(--volt-mint)",
          blue: "var(--volt-blue)",
          gold: "var(--volt-gold)",
        },
        primary: {
          50: '#f7f1e4',
          100: '#efe2c4',
          200: '#e3b760',
          300: '#d4a84a',
          400: '#c4963a',
          500: '#e3b760',
          600: '#a36714',
          700: '#78521c',
          800: '#5c3f16',
          900: '#3d2a0f',
        },
        secondary: {
          50: '#e8f0ef',
          100: '#c5d8d6',
          200: '#90b4b1',
          300: '#6a9693',
          400: '#4f7a77',
          500: '#41646a',
          600: '#36484a',
          700: '#253134',
          800: '#1d2628',
          900: '#121719',
        },
        success: {
          50: '#e8f8f0',
          100: '#c5ecd8',
          200: '#6ecf9b',
          300: '#4cba82',
          400: '#36a56c',
          500: '#2e7d32',
          600: '#256628',
          700: '#1c4f1f',
          800: '#143816',
          900: '#0c220d',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
export default config;

