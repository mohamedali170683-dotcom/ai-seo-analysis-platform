import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        headline: ['var(--font-work-sans)', 'Work Sans', 'sans-serif'],
        body: ['var(--font-rubik)', 'Rubik', 'sans-serif'],
      },
      colors: {
        // Stratum brand
        petrol: {
          DEFAULT: '#173D32',
          light: '#1D5142',
          lighter: '#ACD3C8',
        },
        'stratum-orange': {
          DEFAULT: '#EB4200',
          lighter: '#E3B5A3',
        },
        'stratum-blue': {
          DEFAULT: '#396FFA',
          lighter: '#D0DBF9',
          darker: '#192F80',
        },
        // Stratum neutrals
        'off-black': '#062121',
        'off-white': '#FBF9F5',
        'off-grey': '#B0B0B0',
        // Semantic tokens (mapped to Stratum)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
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
