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
    },
  },
  plugins: [],
}
export default config
