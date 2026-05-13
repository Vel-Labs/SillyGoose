import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        parchment: "#f3dfb4",
        ink: "#12100d",
        coal: "#171717",
        ember: "#c93320",
        signal: "#f4a51c",
        gooseblue: "#1265b7"
      },
      boxShadow: {
        poster: "0 18px 50px rgba(0,0,0,.35)",
        insetInk: "inset 0 0 0 3px #12100d"
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "Arial Black", "sans-serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
