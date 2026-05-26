import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        terracotta: {
          50:  "#fdf4f0",
          100: "#fae4d8",
          200: "#f5c5ac",
          300: "#ed9d78",
          400: "#e37045",
          500: "#c8522a",
          600: "#a8401f",
          700: "#86311a",
          800: "#65241a",
          900: "#4a1a13",
        },
        olive: {
          50:  "#f4f6ef",
          100: "#e5ebd8",
          200: "#cad6b2",
          300: "#a8bc84",
          400: "#85a05a",
          500: "#647d3e",
          600: "#4f6330",
          700: "#3d4d26",
          800: "#2e3a1e",
          900: "#202918",
        },
        cream: {
          50:  "#fffdf7",
          100: "#fef9ea",
          200: "#fdf0cc",
          300: "#fbe4a3",
          400: "#f8d270",
          500: "#f0b429",
        },
        graphite: {
          50:  "#f5f5f4",
          100: "#e8e7e5",
          200: "#d1cfcb",
          300: "#b0ada7",
          400: "#8b8780",
          500: "#6e6a63",
          600: "#57534d",
          700: "#44403c",
          800: "#292524",
          900: "#1c1917",
        },
      },
      fontFamily: {
        sans:    ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        "warm-sm": "0 1px 3px 0 rgba(200, 82, 42, 0.08)",
        "warm-md": "0 4px 12px 0 rgba(200, 82, 42, 0.12)",
        "card":    "0 2px 8px 0 rgba(41, 37, 36, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;