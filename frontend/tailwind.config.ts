import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-kanit)", "ui-sans-serif", "system-ui"]
      },
      colors: {
        primary: {
          DEFAULT: "#0f766e",
          50: "#e6faf7",
          100: "#c0f0e6",
          200: "#99e6d6",
          300: "#66d4c0",
          400: "#33c2aa",
          500: "#0f9f88",
          600: "#0f766e",
          700: "#0c5a53",
          800: "#093f39",
          900: "#06231f"
        }
      }
    }
  },
  plugins: []
};

export default config;

