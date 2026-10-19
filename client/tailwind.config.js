import { heroui } from "@heroui/theme";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ateneo: {
          blue: '#003366',
          gold: '#C5A900',
        },
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        pulseGlow: 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: "#003366",
              foreground: "#FFFFFF",
            },
            secondary: {
              DEFAULT: "#C5A900",
              foreground: "#000000",
            },
            focus: "#003366",
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: "#38bdf8",
              foreground: "#000000",
            },
            secondary: {
              DEFAULT: "#fbbf24",
              foreground: "#000000",
            },
            focus: "#38bdf8",
          },
        },
      },
    }),
  ],
};
