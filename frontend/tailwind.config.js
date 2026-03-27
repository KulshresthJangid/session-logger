/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0f1117',
          secondary: '#161b22',
          tertiary: '#21262d',
          border: '#30363d',
        },
        accent: {
          DEFAULT: '#58a6ff',
          hover: '#79b8ff',
          muted: '#388bfd26',
        },
        success: '#3fb950',
        warning: '#d29922',
        danger: '#f85149',
        muted: '#8b949e',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
