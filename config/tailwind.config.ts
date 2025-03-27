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
        primary: '#6B46C1', // Bold purple
        secondary: '#9F7AEA', // Lighter purple
        dark: '#1A202C', // Light black
        light: '#F7FAFC', // Off-white
      },
    },
  },
  plugins: [],
}
export default config 