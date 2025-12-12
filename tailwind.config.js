/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f2f7ff',
          100: '#dcebff',
          200: '#b9d7ff',
          300: '#8dbdff',
          400: '#5a9bff',
          500: '#2c75ff',
          600: '#1b5ee0',
          700: '#154aba',
          800: '#133c95',
          900: '#113477'
        }
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
}

