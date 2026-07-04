/** Mirrors the ICOM web app's brand palette (see ../tailwind.config.ts). */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#050508",
        surface: "#0d0d1a",
        card: "#12121f",
        border: "#26263a",
        muted: "#8b8ba3",
        icon: {
          50: "#f0f0ff",
          100: "#e4e4ff",
          200: "#ccccff",
          300: "#a8a8ff",
          400: "#7c7cff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
      },
    },
  },
  plugins: [],
};
