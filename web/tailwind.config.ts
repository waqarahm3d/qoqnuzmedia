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
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'soundwave-1': 'soundwave 0.5s ease-in-out infinite',
        'soundwave-2': 'soundwave 0.5s ease-in-out 0.1s infinite',
        'soundwave-3': 'soundwave 0.5s ease-in-out 0.2s infinite',
        'soundwave-4': 'soundwave 0.5s ease-in-out 0.3s infinite',
      },
    },
  },
  plugins: [],
}
export default config
