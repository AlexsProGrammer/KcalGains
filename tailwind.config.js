/** @type {import('tailwindcss').Config} */

/** Builds a token-backed color entry supporting Tailwind's opacity modifier. */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

const accentRamp = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((step) => [step, token(`accent-${step}`)]),
)

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.25rem',
      screens: { '2xl': '1280px' },
    },
    extend: {
      screens: {
        xs: '380px',
      },
      colors: {
        accent: {
          ...accentRamp,
          DEFAULT: token('accent-fill'),
          fill: token('accent-fill'),
          'fill-hover': token('accent-fill-hover'),
          contrast: token('accent-contrast'),
          text: token('accent-text'),
        },
        surface: {
          DEFAULT: token('surface-1'),
          0: token('surface-0'),
          1: token('surface-1'),
          2: token('surface-2'),
          3: token('surface-3'),
        },
        line: {
          DEFAULT: token('line'),
          subtle: token('line-subtle'),
          strong: token('line-strong'),
        },
        ink: {
          DEFAULT: token('ink-mid'),
          hi: token('ink-hi'),
          mid: token('ink-mid'),
          low: token('ink-low'),
          inverse: token('ink-inverse'),
        },
        success: { DEFAULT: token('success'), soft: token('success-soft') },
        warning: { DEFAULT: token('warning'), soft: token('warning-soft') },
        danger: { DEFAULT: token('danger'), soft: token('danger-soft') },
        info: { DEFAULT: token('info'), soft: token('info-soft') },
        macro: {
          protein: token('macro-protein'),
          carbs: token('macro-carbs'),
          fat: token('macro-fat'),
        },
        slate: {
          950: '#020617',
        },
        zinc: {
          950: '#09090b',
        },
      },
      spacing: {
        'safe-t': 'env(safe-area-inset-top)',
        'safe-b': 'env(safe-area-inset-bottom)',
        'safe-l': 'env(safe-area-inset-left)',
        'safe-r': 'env(safe-area-inset-right)',
        'tab-bar': 'calc(4rem + env(safe-area-inset-bottom))',
      },
      minHeight: {
        touch: '44px',
        screen: '100dvh',
      },
      minWidth: {
        touch: '44px',
      },
      height: {
        screen: '100dvh',
        'tab-bar': 'calc(4rem + env(safe-area-inset-bottom))',
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['3.5rem', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '700' }],
        display: ['2.75rem', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '700' }],
        'stat-lg': ['2rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        stat: ['1.5rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '600' }],
        'stat-sm': ['1.125rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        overline: ['0.6875rem', { lineHeight: '1', letterSpacing: '0.14em', fontWeight: '600' }],
      },
      borderRadius: {
        card: '1rem',
        sheet: '1.5rem',
      },
      boxShadow: {
        'elevation-1': '0 1px 2px 0 rgb(0 0 0 / 0.4)',
        'elevation-2': '0 8px 24px -8px rgb(0 0 0 / 0.6), 0 2px 6px -2px rgb(0 0 0 / 0.4)',
        'elevation-3': '0 24px 48px -12px rgb(0 0 0 / 0.7)',
        'accent-glow': '0 0 0 1px rgb(var(--accent-fill) / 0.35), 0 8px 32px -8px rgb(var(--accent-fill) / 0.35)',
      },
      backdropBlur: {
        nav: '16px',
      },
      transitionTimingFunction: {
        emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 160ms cubic-bezier(0.2, 0, 0, 1)',
        'sheet-up': 'sheet-up 260ms cubic-bezier(0.2, 0, 0, 1)',
        'scale-in': 'scale-in 160ms cubic-bezier(0.2, 0, 0, 1)',
      },
    },
  },
  plugins: [],
}
