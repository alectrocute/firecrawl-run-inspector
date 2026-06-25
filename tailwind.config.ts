import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{vue,js,ts}',
    './pages/**/*.vue',
    './components/**/*.vue',
  ],
  theme: {
    extend: {
      colors: {
        // Firecrawl "ember" — the single rationed brand signal (heat #fa5d19).
        // Reserve for CTAs, the fire mark, accent text, badge dots, active states.
        flame: {
          50: '#fff4ee',
          100: '#ffe6d8',
          200: '#ffc9ad',
          300: '#ffa377',
          400: '#ff7a40',
          500: '#fa5d19',
          600: '#e54e0e',
          700: '#bd3f0f',
          800: '#963414',
          900: '#7a2d15',
          950: '#421405',
        },
        // Neutral graphite scale — no blue tint. ash-800 (#262626) == Firecrawl "ink".
        ash: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        // Dark code-window surface, slightly lifted off the near-black canvas.
        code: {
          surface: '#111111',
          border: '#262626',
          line: '#2e2e2e',
        },
      },
      fontFamily: {
        // Suisse is licensed; Inter is Firecrawl's documented fallback grotesque.
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'ui-monospace', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
