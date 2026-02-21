import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:      '#080808',
        surface: '#111111',
        surf2:   '#1a1a1a',
        border:  '#252525',
        accent:  '#e8372c',
        accent2: '#b82a21',
        green:   '#2ce87a',
      },
      fontFamily: {
        sans: ['var(--font-zen)', 'Noto Sans JP', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
