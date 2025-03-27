import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        gradientShift: 'gradientShift 3s linear infinite',
        gradientFlow: 'gradientFlow 3s ease infinite',
      },
      keyframes: {
        gradientShift: {
          '0%': {
            'background-position': '0% 50%',
          },
          '100%': {
            'background-position': '200% 50%',
          },
        },
        gradientFlow: {
          '0%': {
            'background-position': '0% 50%',
          },
          '50%': {
            'background-position': '100% 50%',
          },
          '100%': {
            'background-position': '0% 50%',
          },
        },
      },
    },
  },
  plugins: [],
}
export default config 