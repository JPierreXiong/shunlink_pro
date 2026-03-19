import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Primary: Syne — geometric, architectural, distinctive
        sans: ['var(--font-syne)', 'system-ui', 'sans-serif'],
        // Mono: for code/API docs
        mono: ['var(--font-geist-mono)', 'Menlo', 'monospace'],
        // Display: for hero headings
        display: ['var(--font-syne)', 'sans-serif'],
      },
      colors: {
        // Brand palette — deep navy + electric cyan + warm bone
        brand: {
          bg:       '#080C14',   // near-black navy background
          surface:  '#0D1421',   // card surface
          border:   '#1A2540',   // subtle border
          cyan:     '#00D4FF',   // primary accent
          'cyan-dim':'#0096B3',  // muted accent
          amber:    '#FFB347',   // warning / need_2fa
          green:    '#00E5A0',   // success
          red:      '#FF4D6D',   // error / failed
          text:     '#E8EDF5',   // primary text
          muted:    '#5A6A85',   // secondary text
        },
      },
      backgroundImage: {
        // Subtle grid pattern for hero
        'grid-pattern': `linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)`,
        // Radial glow for hero
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0,212,255,0.15), transparent)',
        // Card gradient
        'card-gradient': 'linear-gradient(135deg, rgba(13,20,33,0.9) 0%, rgba(8,12,20,0.95) 100%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'glow-cyan':  '0 0 20px rgba(0,212,255,0.25), 0 0 60px rgba(0,212,255,0.08)',
        'glow-green': '0 0 20px rgba(0,229,160,0.25)',
        'glow-amber': '0 0 20px rgba(255,179,71,0.25)',
        'card':       '0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04) inset',
      },
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.5rem',
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-up':      'fadeUp 0.6s ease forwards',
        'fade-in':      'fadeIn 0.4s ease forwards',
        'countdown':    'countdown 1s linear infinite',
        'shimmer':      'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

export default config


