/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "rgb(var(--brand-bg) / <alpha-value>)",
          surface: "rgb(var(--brand-surface) / <alpha-value>)",
          muted: "rgb(var(--brand-muted) / <alpha-value>)",
          border: "rgb(var(--brand-border) / <alpha-value>)",
          soft: "rgb(var(--brand-soft) / <alpha-value>)",
          text: "rgb(var(--brand-text) / <alpha-value>)",
          sub: "rgb(var(--brand-sub) / <alpha-value>)",
          accent: "rgb(var(--brand-accent) / <alpha-value>)",
          emergency: "#ef4444",
          red: "#dc2626",
          dark: "rgb(var(--brand-dark) / <alpha-value>)",
          card: "rgb(var(--brand-card) / <alpha-value>)",
          ink: "rgb(var(--brand-ink) / <alpha-value>)",
          footer: "rgb(var(--brand-footer) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        emergency: "0 10px 40px -8px rgba(239, 68, 68, 0.45)",
        card: "var(--shadow-card)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
