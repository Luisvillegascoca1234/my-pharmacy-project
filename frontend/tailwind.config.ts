import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(214 32% 91%)",
        background: "hsl(210 40% 98%)",
        foreground: "hsl(222 47% 11%)",
        muted: "hsl(215 20% 65%)",
        surface: "hsl(0 0% 100%)",
        primary: "hsl(173 80% 28%)",
        accent: "hsl(23 86% 55%)"
      },
      boxShadow: {
        panel: "0 20px 60px rgb(15 23 42 / 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
