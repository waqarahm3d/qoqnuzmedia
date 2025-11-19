import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ff4a14',
        background: '#121212',
        surface: '#181818',
        qoqnuz: {
          primary: '#ff4a14',
          secondary: '#191414',
          bg: '#121212',
          surface: '#181818',
          text: '#FFFFFF',
          'text-secondary': '#B3B3B3',
        },
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'soundwave': {
          '0%, 100%': { height: '4px' },
          '50%': { height: '16px' },
        },
        // Genre chip animations
        'chip-glow': {
          '0%, 100%': { boxShadow: '0 0 5px var(--chip-color), 0 0 10px var(--chip-color)' },
          '50%': { boxShadow: '0 0 20px var(--chip-color), 0 0 40px var(--chip-color), 0 0 60px var(--chip-color)' },
        },
        'chip-shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'chip-bounce': {
          '0%, 100%': { transform: 'scale(1) translateY(0)' },
          '25%': { transform: 'scale(1.05) translateY(-2px)' },
          '50%': { transform: 'scale(1.1) translateY(-4px)' },
          '75%': { transform: 'scale(1.05) translateY(-2px)' },
        },
        'chip-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.02)' },
        },
        'chip-float': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-3px) rotate(1deg)' },
          '75%': { transform: 'translateY(-3px) rotate(-1deg)' },
        },
        'border-dance': {
          '0%, 100%': { borderColor: 'var(--chip-color)' },
          '50%': { borderColor: 'var(--chip-color-light)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'soundwave-1': 'soundwave 0.5s ease-in-out infinite',
        'soundwave-2': 'soundwave 0.5s ease-in-out 0.1s infinite',
        'soundwave-3': 'soundwave 0.5s ease-in-out 0.2s infinite',
        'soundwave-4': 'soundwave 0.5s ease-in-out 0.3s infinite',
        // Genre chip animations
        'chip-glow': 'chip-glow 2s ease-in-out infinite',
        'chip-shimmer': 'chip-shimmer 3s ease-in-out infinite',
        'chip-bounce': 'chip-bounce 0.6s ease-in-out',
        'chip-pulse': 'chip-pulse 2s ease-in-out infinite',
        'chip-float': 'chip-float 3s ease-in-out infinite',
        'border-dance': 'border-dance 1.5s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
      },
    },
  },
  plugins: [],
}
export default config
