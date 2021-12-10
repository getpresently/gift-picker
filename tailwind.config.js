module.exports = {
  purge: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        selected: "#FF5D81",
        unselected: "#F9FBFF",
        deepGrey: "#444253",
        midGrey: "#AEAFB7",
        deepBlack: "#272833",
      },
    },
    maxWidth: {
      "xxs": "16rem",
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
