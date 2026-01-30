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
        canvas: "#FDFBF7", // Warm Cream
        ink: "#2D2D2D", // Deep Charcoal
        primary: "#C86B56", // Burnt Terracotta
        secondary: "#8FA692", // Sage Green
        muted: "#A8A29E", // Warm Gray
        border: "#E5E5E5",
      },
      fontFamily: {
        serif: ["Playfair Display", "serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "paper-texture": "url('/paper-noise.png')",
      },
    },
  },
  plugins: [],
};
export default config;