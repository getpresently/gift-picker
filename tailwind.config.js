module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        selected: '#FF5D81',
        unselected: '$F9FBFF'
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
