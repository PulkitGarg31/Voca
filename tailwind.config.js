/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      // Semantic tokens backed by CSS variables (RGB channels) so that
      // opacity modifiers (e.g. bg-accent/10) work and dark mode is a
      // single class flip on <html>. Values live in app/globals.css.
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        "line-strong": "rgb(var(--line-strong) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        faint: "rgb(var(--faint) / <alpha-value>)",
        ghost: "rgb(var(--ghost) / <alpha-value>)",
        "ghost-hover": "rgb(var(--ghost-hover) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-hover": "rgb(var(--accent-hover) / <alpha-value>)",
        "cell-0": "rgb(var(--cell-0) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["DM Sans", "var(--font-inter)", "system-ui", "sans-serif"],
        display: ["Bebas Neue", "sans-serif"],
      },
    },
  },
  plugins: [],
};
