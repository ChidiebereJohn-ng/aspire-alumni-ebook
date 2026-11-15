/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#148D93',
          'teal-dark': '#0E6B70',
          'teal-tint': '#E6F4F4',
          orange: '#F7822D',
          gold: '#F5A623',
          red: '#D63A3F',
          charcoal: '#1F2A30',
          cream: '#FBF8F4',
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', '"DM Sans"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'cohort': '0.15em',
      }
    },
  },
  plugins: [],
}
