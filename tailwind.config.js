/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        'brut-bg': '#FFFEF2',
        'brut-card': '#FFFFFF',
        'brut-text': '#0D0D0D',
        'brut-muted': '#555555',
        'brut-accent': '#FFE500',
        'brut-border': '#0D0D0D',
        'brut-line': '#E8E6D0',
      },
      boxShadow: {
        'brut': '3px 3px 0 #0D0D0D',
        'brut-lg': '5px 5px 0 #0D0D0D',
        'brut-accent': '3px 3px 0 #FFE500',
        'brut-accent-lg': '5px 5px 0 #FFE500',
      },
    },
  },
  plugins: [],
}
