import tailwindAnimate from "tailwindcss-animate"

// One green: the FarmIntelytics logo. Leaf #5AA041 is 500 and forest #034321
// is 900; every other shade sits between them. Emerald points at the same
// scale so no second green can creep in. Values live in src/index.css.
const SHADES = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"]
const logoGreen = Object.fromEntries(SHADES.map((k) => [k, `rgb(var(--green-${k}) / <alpha-value>)`]))

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: logoGreen,
        emerald: logoGreen,
        brand: { DEFAULT: "rgb(var(--green-600) / <alpha-value>)", leaf: "rgb(var(--green-500) / <alpha-value>)", forest: "rgb(var(--green-900) / <alpha-value>)" },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        cocoa: "var(--cocoa)",
        leaf: "var(--leaf)",
        canopy: "var(--canopy)",
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          foreground: "var(--warning-foreground)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          foreground: "var(--danger-foreground)",
        },
        status: {
          live: "var(--status-live)",
          good: "var(--status-good)",
          warning: "var(--status-warning)",
          critical: "var(--status-critical)",
          info: "var(--status-info)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [tailwindAnimate],
}

