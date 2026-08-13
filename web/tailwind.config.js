/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#38bdf8", dark: "#6366f1" },
        surface: "#0f172a",
        card: "#1e293b",
      },
    },
  },
  plugins: [],
};
