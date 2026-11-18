import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' }, screens: { '2xl': '1280px' } },
    extend: {
      colors: {
        ivory: '#FAF8F5',
        sage: { DEFAULT: '#A8B9A5', light: '#DCE5DA', dark: '#7E957A' },
        forest: { DEFAULT: '#294B43', light: '#3B6359', dark: '#1D3731' },
        peach: { DEFAULT: '#F4E5DA', dark: '#E8CDB9' },
        lavender: { DEFAULT: '#E9E3F1', dark: '#D3C8E3' },
        butter: { DEFAULT: '#F6EBC8', dark: '#EBD89A' },
        charcoal: { DEFAULT: '#303735', soft: '#5A6360' },
        terracotta: '#B5654A',
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(41,75,67,0.06), 0 12px 32px -8px rgba(41,75,67,0.12)',
        lift: '0 4px 12px -2px rgba(41,75,67,0.08), 0 24px 48px -12px rgba(41,75,67,0.2)',
      },
      borderRadius: { '4xl': '2rem', '5xl': '2.5rem' },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        'accordion-down': 'accordion-down 0.3s ease-out',
        'accordion-up': 'accordion-up 0.25s ease-out',
      },
    },
  },
  plugins: [animate],
} satisfies Config
