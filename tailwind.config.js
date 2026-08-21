/** @type {import('tailwindcss').Config} */
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
      colors: {
        slate: {
          950: '#020617',
        },
        zinc: {
          950: '#09090b',
        },
      },
    },
  },
  plugins: [],
}
