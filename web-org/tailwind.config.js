/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#1e4db7", dark: "#163a8a" },
        emergency: "#dc2626",
      },
    },
  },
  plugins: [],
};
