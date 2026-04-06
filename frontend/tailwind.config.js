/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#000000',      // pure black canvas
          secondary: '#0d0d0d',    // cards
          tertiary: '#1a1a1a',     // inputs, hover states
          border: '#2e2e2e',       // dividers and borders
        },
        accent: {
          DEFAULT: '#ffffff',      // white — the only 'colour'
          hover: '#e0e0e0',
          muted: '#ffffff14',      // subtle white fill
        },
        success: '#ffffff',        // live timers / active dot — white
        warning: '#a3a3a3',        // neutral grey
        danger: '#ef4444',         // red — kept only for destructive actions
        muted: '#737373',          // secondary text
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
