import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        // ── Seoul Morning brand palette ─────────────────────────────
        // The codebase uses Tailwind's indigo/violet/purple/cyan classes
        // everywhere, so the rebrand remaps those scales here:
        //   indigo        → ICOM green (subway-line green, the brand colour)
        //   violet/purple → navy ink (secondary)
        //   cyan          → teal (supporting accent)
        indigo: {
          50: "#ecf9f1", 100: "#d1f0de", 200: "#a5e1c0", 300: "#6dcb98", 400: "#2fb36f",
          500: "#00994a", 600: "#007f3b", 700: "#006a33", 800: "#0b552b", 900: "#0c4625", 950: "#042a15",
        },
        violet: {
          50: "#f0f3f9", 100: "#dfe5f1", 200: "#c1cce3", 300: "#97a9cd", 400: "#6f86b6",
          500: "#4f6799", 600: "#3d527d", 700: "#2f3f62", 800: "#22304b", 900: "#16213a", 950: "#0d1424",
        },
        purple: {
          50: "#f0f3f9", 100: "#dfe5f1", 200: "#c1cce3", 300: "#97a9cd", 400: "#6f86b6",
          500: "#4f6799", 600: "#3d527d", 700: "#2f3f62", 800: "#22304b", 900: "#16213a", 950: "#0d1424",
        },
        cyan: {
          50: "#ebfaf6", 100: "#cdf2e9", 200: "#9fe5d4", 300: "#7fdcc8", 400: "#3cc4a8",
          500: "#15a98d", 600: "#0d8a74", 700: "#0c6e5e", 800: "#0e584c", 900: "#0f4940", 950: "#032b26",
        },
        coral: { 400: "#ff8577", 500: "#ff6b5a", 600: "#e5533f" },
        icon: {
          50: "#ecf9f1", 100: "#d1f0de", 200: "#a5e1c0", 300: "#6dcb98", 400: "#2fb36f",
          500: "#00994a", 600: "#007f3b", 700: "#006a33", 800: "#0b552b", 900: "#0c4625",
        },
      },
      fontFamily: {
        // Gothic A1 covers Latin and Hangul in one family, so mixed text like
        // "외국인등록증 (ARC)" sits on one baseline.
        sans: ["Gothic A1", "Apple SD Gothic Neo", "Malgun Gothic", "system-ui", "sans-serif"],
        display: ["Gothic A1", "Apple SD Gothic Neo", "Malgun Gothic", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-gradient": "linear-gradient(135deg, #070b14 0%, #0b1220 50%, #0d1424 100%)",
        "card-gradient": "linear-gradient(135deg, rgba(0,153,74,0.1) 0%, rgba(61,82,125,0.05) 100%)",
        "glow-gradient": "radial-gradient(ellipse at center, rgba(0,153,74,0.15) 0%, transparent 70%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "gradient-x": "gradientX 3s ease infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0,153,74,0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(0,153,74,0.6)" },
        },
        gradientX: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      boxShadow: {
        glow: "0 0 30px rgba(0,153,74,0.3)",
        "glow-lg": "0 0 60px rgba(0,153,74,0.4)",
        glass: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
        card: "0 1px 3px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.3)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
