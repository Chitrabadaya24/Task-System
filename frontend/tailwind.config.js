/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
        serif: ["'DM Serif Display'", "Georgia", "serif"],
      },
      colors: {
        purple: {
          50:  "#f3f0ff",
          100: "#ede9ff",
          500: "#8b6dff",
          600: "#6c47ff",
          700: "#5535e0",
        },
        teal: { 400: "#00c9a7", 100: "#e0faf5" },
      },
      borderRadius: { xl: "1rem", "2xl": "1.25rem", "3xl": "1.5rem" },
      boxShadow: {
        soft: "0 4px 20px rgba(108,71,255,0.10)",
        card: "0 2px 8px rgba(108,71,255,0.06)",
      },
    },
  },
  plugins: [],
}
