/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#fff7f7",
          surface: "#fff5f5",
          muted: "#fee2e2",
          border: "#fecaca",
          soft: "#fca5a5",
          text: "#7f1d1d",
          sub: "#991b1b",
          accent: "#b91c1c",
          emergency: "#ef4444",
          red: "#dc2626",
          dark: "#450a0a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        emergency: "0 10px 40px -8px rgba(239, 68, 68, 0.45)",
        card: "0 10px 30px -12px rgba(69, 10, 10, 0.18)",
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
